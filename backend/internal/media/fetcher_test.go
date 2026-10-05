package media

import (
	"context"
	"errors"
	"io"
	"net"
	"net/http"
	"strings"
	"testing"
	"time"
)

type fakeResolver struct {
	answers map[string][]net.IPAddr
}

func (f fakeResolver) LookupIPAddr(_ context.Context, host string) ([]net.IPAddr, error) {
	answers, ok := f.answers[host]
	if !ok {
		return nil, errors.New("host not found")
	}
	return answers, nil
}

type fakeDialer struct {
	addresses []string
}

func (f *fakeDialer) DialContext(_ context.Context, network, address string) (net.Conn, error) {
	f.addresses = append(f.addresses, address)
	return nil, errors.New("dial stopped by test")
}

type roundTripFunc func(*http.Request) (*http.Response, error)

func (f roundTripFunc) RoundTrip(r *http.Request) (*http.Response, error) { return f(r) }

func TestSafeDialerRejectsAnyUnsafeDNSAnswerBeforeDial(t *testing.T) {
	resolver := fakeResolver{answers: map[string][]net.IPAddr{
		"media.example.com": {
			{IP: net.ParseIP("203.0.113.8")},
			{IP: net.ParseIP("169.254.169.254")},
		},
	}}
	dialer := &fakeDialer{}
	safe := NewSafeDialer(resolver, dialer)

	_, err := safe.DialContext(context.Background(), "tcp", "media.example.com:443")
	if !errors.Is(err, ErrUnsafeResolvedAddress) {
		t.Fatalf("DialContext() error = %v; want ErrUnsafeResolvedAddress", err)
	}
	if len(dialer.addresses) != 0 {
		t.Fatalf("unsafe DNS answer reached network dialer: %#v", dialer.addresses)
	}
}

func TestSafeDialerPinsDialToValidatedIPAddress(t *testing.T) {
	resolver := fakeResolver{answers: map[string][]net.IPAddr{
		"media.example.com": {{IP: net.ParseIP("203.0.113.8")}},
	}}
	dialer := &fakeDialer{}
	safe := NewSafeDialer(resolver, dialer)

	_, err := safe.DialContext(context.Background(), "tcp", "media.example.com:443")
	if err == nil {
		t.Fatal("fake dial unexpectedly succeeded")
	}
	if len(dialer.addresses) != 1 || dialer.addresses[0] != "203.0.113.8:443" {
		t.Fatalf("dial addresses = %#v; want validated IP literal", dialer.addresses)
	}
}

func TestRemoteFetcherRejectsRedirectToUnapprovedHost(t *testing.T) {
	fetcher := NewRemoteFetcher(RemoteFetcherConfig{
		AllowedHosts: []string{"example.com"},
		MaxBytes:     1024,
		Timeout:      time.Second,
	})

	err := fetcher.ValidateRedirect(
		mustRequest(t, "https://evil.test/video.mp4"),
		[]*http.Request{mustRequest(t, "https://media.example.com/video.mp4")},
	)
	if !errors.Is(err, ErrUnsafeRedirect) {
		t.Fatalf("ValidateRedirect() error = %v; want ErrUnsafeRedirect", err)
	}
}

func TestRemoteFetcherCapsRedirectCount(t *testing.T) {
	fetcher := NewRemoteFetcher(RemoteFetcherConfig{
		AllowedHosts: []string{"example.com"},
		MaxRedirects: 2,
		MaxBytes:     1024,
		Timeout:      time.Second,
	})

	err := fetcher.ValidateRedirect(
		mustRequest(t, "https://media.example.com/final.mp4"),
		[]*http.Request{
			mustRequest(t, "https://media.example.com/one"),
			mustRequest(t, "https://media.example.com/two"),
		},
	)
	if !errors.Is(err, ErrTooManyRedirects) {
		t.Fatalf("ValidateRedirect() error = %v; want ErrTooManyRedirects", err)
	}
}

func TestRemoteFetcherRejectsOversizedBodyAndUnexpectedMIME(t *testing.T) {
	fetcher := NewRemoteFetcher(RemoteFetcherConfig{
		AllowedHosts:       []string{"example.com"},
		AllowedMIMEPrefixes: []string{"video/"},
		MaxBytes:           4,
		Timeout:            time.Second,
	})

	oversized := &http.Response{
		StatusCode: http.StatusOK,
		Header:     http.Header{"Content-Type": []string{"video/mp4"}},
		Body:       io.NopCloser(strings.NewReader("12345")),
	}
	if _, err := fetcher.ReadValidatedResponse(oversized); !errors.Is(err, ErrMediaTooLarge) {
		t.Fatalf("oversized response error = %v; want ErrMediaTooLarge", err)
	}

	wrongMIME := &http.Response{
		StatusCode: http.StatusOK,
		Header:     http.Header{"Content-Type": []string{"text/html; charset=utf-8"}},
		Body:       io.NopCloser(strings.NewReader("1234")),
	}
	if _, err := fetcher.ReadValidatedResponse(wrongMIME); !errors.Is(err, ErrUnexpectedMediaType) {
		t.Fatalf("wrong MIME error = %v; want ErrUnexpectedMediaType", err)
	}
}

func TestRemoteFetcherAcceptsBoundedAllowedMedia(t *testing.T) {
	fetcher := NewRemoteFetcher(RemoteFetcherConfig{
		AllowedHosts:       []string{"example.com"},
		AllowedMIMEPrefixes: []string{"video/"},
		MaxBytes:           8,
		Timeout:            time.Second,
	})
	response := &http.Response{
		StatusCode: http.StatusOK,
		Header:     http.Header{"Content-Type": []string{"video/mp4"}},
		Body:       io.NopCloser(strings.NewReader("1234")),
	}

	body, err := fetcher.ReadValidatedResponse(response)
	if err != nil {
		t.Fatalf("ReadValidatedResponse() error = %v", err)
	}
	if string(body) != "1234" {
		t.Fatalf("body = %q; want %q", body, "1234")
	}
}

func mustRequest(t *testing.T, rawURL string) *http.Request {
	t.Helper()
	r, err := http.NewRequest(http.MethodGet, rawURL, nil)
	if err != nil {
		t.Fatalf("NewRequest(%q): %v", rawURL, err)
	}
	return r
}
