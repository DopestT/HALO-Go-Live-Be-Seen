package media

import (
	"context"
	"errors"
	"fmt"
	"io"
	"mime"
	"net"
	"net/http"
	"strings"
	"time"
)

var (
	ErrUnsafeResolvedAddress = errors.New("remote media host resolved to an unsafe address")
	ErrUnsafeRedirect        = errors.New("remote media redirect is not permitted")
	ErrTooManyRedirects      = errors.New("remote media redirect limit exceeded")
	ErrMediaTooLarge         = errors.New("remote media exceeds configured size limit")
	ErrUnexpectedMediaType   = errors.New("remote media content type is not permitted")
	ErrRemoteFetchStatus     = errors.New("remote media returned an unsuccessful HTTP status")
)

type IPResolver interface {
	LookupIPAddr(ctx context.Context, host string) ([]net.IPAddr, error)
}

type ContextDialer interface {
	DialContext(ctx context.Context, network, address string) (net.Conn, error)
}

type SafeDialer struct {
	resolver IPResolver
	dialer   ContextDialer
}

func NewSafeDialer(resolver IPResolver, dialer ContextDialer) *SafeDialer {
	if resolver == nil {
		resolver = net.DefaultResolver
	}
	if dialer == nil {
		dialer = &net.Dialer{Timeout: 5 * time.Second, KeepAlive: 30 * time.Second}
	}
	return &SafeDialer{resolver: resolver, dialer: dialer}
}

// DialContext resolves the requested hostname once, rejects the entire answer
// set if any address is unsafe, then dials a validated IP literal. This avoids
// a second DNS lookup between validation and connection and reduces DNS-rebinding
// exposure at the application layer.
func (d *SafeDialer) DialContext(ctx context.Context, network, address string) (net.Conn, error) {
	if d == nil || d.resolver == nil || d.dialer == nil {
		return nil, errors.New("safe dialer is not configured")
	}

	host, port, err := net.SplitHostPort(address)
	if err != nil {
		return nil, fmt.Errorf("parse remote address: %w", err)
	}

	if ip := net.ParseIP(host); ip != nil {
		if isUnsafeIP(ip) {
			return nil, ErrUnsafeResolvedAddress
		}
		return d.dialer.DialContext(ctx, network, net.JoinHostPort(ip.String(), port))
	}

	answers, err := d.resolver.LookupIPAddr(ctx, host)
	if err != nil {
		return nil, fmt.Errorf("resolve remote media host: %w", err)
	}
	if len(answers) == 0 {
		return nil, errors.New("remote media host resolved to no addresses")
	}

	for _, answer := range answers {
		if answer.IP == nil || isUnsafeIP(answer.IP) {
			return nil, ErrUnsafeResolvedAddress
		}
	}

	return d.dialer.DialContext(ctx, network, net.JoinHostPort(answers[0].IP.String(), port))
}

type RemoteFetcherConfig struct {
	AllowedHosts        []string
	AllowedMIMEPrefixes []string
	MaxBytes            int64
	MaxRedirects        int
	Timeout             time.Duration
	Resolver            IPResolver
	Dialer              ContextDialer
}

type RemoteFetcher struct {
	allowedHosts        []string
	allowedMIMEPrefixes []string
	maxBytes            int64
	maxRedirects        int
	client              *http.Client
}

func NewRemoteFetcher(config RemoteFetcherConfig) *RemoteFetcher {
	maxBytes := config.MaxBytes
	if maxBytes <= 0 {
		maxBytes = 64 << 20 // 64 MiB. Larger assets should use a streaming quarantine path.
	}
	maxRedirects := config.MaxRedirects
	if maxRedirects <= 0 {
		maxRedirects = 3
	}
	timeout := config.Timeout
	if timeout <= 0 {
		timeout = 15 * time.Second
	}
	prefixes := make([]string, 0, len(config.AllowedMIMEPrefixes))
	for _, prefix := range config.AllowedMIMEPrefixes {
		prefix = strings.ToLower(strings.TrimSpace(prefix))
		if prefix != "" {
			prefixes = append(prefixes, prefix)
		}
	}
	if len(prefixes) == 0 {
		prefixes = []string{"video/", "image/"}
	}

	safeDialer := NewSafeDialer(config.Resolver, config.Dialer)
	transport := &http.Transport{
		Proxy:                 nil, // Do not inherit HTTP(S)_PROXY for untrusted remote-media fetches.
		DialContext:           safeDialer.DialContext,
		ForceAttemptHTTP2:     true,
		TLSHandshakeTimeout:   5 * time.Second,
		ResponseHeaderTimeout: 10 * time.Second,
		ExpectContinueTimeout: time.Second,
		IdleConnTimeout:       30 * time.Second,
		DisableCompression:    true,
	}

	fetcher := &RemoteFetcher{
		allowedHosts:        append([]string(nil), config.AllowedHosts...),
		allowedMIMEPrefixes: prefixes,
		maxBytes:            maxBytes,
		maxRedirects:        maxRedirects,
	}
	fetcher.client = &http.Client{
		Transport:     transport,
		Timeout:       timeout,
		CheckRedirect: fetcher.ValidateRedirect,
	}
	return fetcher
}

func (f *RemoteFetcher) ValidateRedirect(req *http.Request, via []*http.Request) error {
	if f == nil || req == nil || req.URL == nil {
		return ErrUnsafeRedirect
	}
	if len(via) >= f.maxRedirects {
		return ErrTooManyRedirects
	}
	if !IsAllowedRemoteURL(req.URL.String(), f.allowedHosts) {
		return ErrUnsafeRedirect
	}

	// Credentials and ambient cookies must never be forwarded across a redirect.
	req.Header.Del("Authorization")
	req.Header.Del("Proxy-Authorization")
	req.Header.Del("Cookie")
	return nil
}

func (f *RemoteFetcher) ReadValidatedResponse(response *http.Response) ([]byte, error) {
	if f == nil || response == nil || response.Body == nil {
		return nil, errors.New("remote media response is invalid")
	}
	defer response.Body.Close()

	if response.StatusCode < 200 || response.StatusCode >= 300 {
		return nil, fmt.Errorf("%w: %d", ErrRemoteFetchStatus, response.StatusCode)
	}
	if response.ContentLength > f.maxBytes {
		return nil, ErrMediaTooLarge
	}

	mediaType, _, err := mime.ParseMediaType(response.Header.Get("Content-Type"))
	if err != nil {
		return nil, ErrUnexpectedMediaType
	}
	mediaType = strings.ToLower(mediaType)
	allowed := false
	for _, prefix := range f.allowedMIMEPrefixes {
		if strings.HasPrefix(mediaType, prefix) {
			allowed = true
			break
		}
	}
	if !allowed {
		return nil, ErrUnexpectedMediaType
	}

	body, err := io.ReadAll(io.LimitReader(response.Body, f.maxBytes+1))
	if err != nil {
		return nil, fmt.Errorf("read remote media: %w", err)
	}
	if int64(len(body)) > f.maxBytes {
		return nil, ErrMediaTooLarge
	}
	return body, nil
}

func (f *RemoteFetcher) Fetch(ctx context.Context, rawURL string) ([]byte, error) {
	if f == nil || f.client == nil {
		return nil, errors.New("remote fetcher is not configured")
	}
	if !IsAllowedRemoteURL(rawURL, f.allowedHosts) {
		return nil, ErrInvalidMediaURL
	}

	request, err := http.NewRequestWithContext(ctx, http.MethodGet, rawURL, nil)
	if err != nil {
		return nil, fmt.Errorf("build remote media request: %w", err)
	}
	request.Header.Set("Accept", strings.Join(f.allowedMIMEPrefixes, ", "))
	request.Header.Set("User-Agent", "HALO-Media-Fetcher/1.0")

	response, err := f.client.Do(request)
	if err != nil {
		return nil, fmt.Errorf("fetch remote media: %w", err)
	}
	return f.ReadValidatedResponse(response)
}
