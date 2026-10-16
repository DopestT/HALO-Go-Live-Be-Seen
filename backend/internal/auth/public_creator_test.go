package auth

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/DopestT/HALO-Go-Live-Be-Seen/backend/internal/models"
	"github.com/gin-gonic/gin"
)

type publicCreatorRepoStub struct {
	creators []*models.PublicCreator
	creator  *models.PublicCreator
	listErr  error
	getErr   error
	limit    int
	offset   int
	listCalls int
}

func (r *publicCreatorRepoStub) CreateUser(context.Context, *models.User) error { return nil }
func (r *publicCreatorRepoStub) GetUserByEmail(context.Context, string) (*models.User, error) {
	return nil, sql.ErrNoRows
}
func (r *publicCreatorRepoStub) GetUserByID(context.Context, int64) (*models.User, error) {
	return nil, sql.ErrNoRows
}
func (r *publicCreatorRepoStub) UpdateUser(context.Context, *models.User) error { return nil }
func (r *publicCreatorRepoStub) ListPublicCreators(_ context.Context, limit, offset int) ([]*models.PublicCreator, error) {
	r.listCalls++
	r.limit = limit
	r.offset = offset
	return r.creators, r.listErr
}
func (r *publicCreatorRepoStub) GetPublicCreator(context.Context, int64) (*models.PublicCreator, error) {
	return r.creator, r.getErr
}

func creatorFixture() *models.PublicCreator {
	return &models.PublicCreator{
		ID:          7,
		Username:    "creator7",
		DisplayName: "Creator Seven",
		Bio:         "Public bio",
		AvatarURL:   "https://media.example.test/avatar.jpg",
	}
}

func TestServiceListPublicCreatorsPassesPaginationAndNormalizesEmpty(t *testing.T) {
	repo := &publicCreatorRepoStub{creators: []*models.PublicCreator{creatorFixture()}}
	service := NewService(repo)

	creators, err := service.ListPublicCreators(context.Background(), 12, 24)
	if err != nil {
		t.Fatalf("ListPublicCreators returned error: %v", err)
	}
	if repo.limit != 12 || repo.offset != 24 {
		t.Fatalf("pagination = (%d,%d), want (12,24)", repo.limit, repo.offset)
	}
	if len(creators) != 1 || creators[0].Username != "creator7" {
		t.Fatalf("unexpected creators: %#v", creators)
	}

	repo.creators = nil
	creators, err = service.ListPublicCreators(context.Background(), 20, 0)
	if err != nil {
		t.Fatalf("empty list returned error: %v", err)
	}
	if creators == nil || len(creators) != 0 {
		t.Fatalf("empty list = %#v, want non-nil empty slice", creators)
	}
}

func TestServiceGetPublicCreatorMapsNotFound(t *testing.T) {
	repo := &publicCreatorRepoStub{getErr: sql.ErrNoRows}
	service := NewService(repo)

	_, err := service.GetPublicCreator(context.Background(), 999)
	if !errors.Is(err, ErrPublicCreatorNotFound) {
		t.Fatalf("error = %v, want ErrPublicCreatorNotFound", err)
	}
}

func TestPublicCreatorJSONExcludesPrivateAccountFields(t *testing.T) {
	payload, err := json.Marshal(creatorFixture())
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}
	body := string(payload)
	for _, forbidden := range []string{"email", "password_hash", "is_adult", "adult_mode"} {
		if strings.Contains(body, forbidden) {
			t.Fatalf("public creator JSON contains private field %q: %s", forbidden, body)
		}
	}
}

func TestHandlerListPublicCreatorsAndPaginationValidation(t *testing.T) {
	gin.SetMode(gin.TestMode)
	repo := &publicCreatorRepoStub{creators: []*models.PublicCreator{creatorFixture()}}
	handler := NewHandler(NewService(repo), nil)
	router := gin.New()
	router.GET("/api/v1/creators", handler.ListPublicCreators)

	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodGet, "/api/v1/creators?limit=5&offset=10", nil)
	router.ServeHTTP(recorder, request)
	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d body=%s", recorder.Code, recorder.Body.String())
	}
	if repo.limit != 5 || repo.offset != 10 {
		t.Fatalf("repo pagination = (%d,%d), want (5,10)", repo.limit, repo.offset)
	}
	if strings.Contains(recorder.Body.String(), "email") {
		t.Fatalf("response leaked private fields: %s", recorder.Body.String())
	}

	bad := httptest.NewRecorder()
	router.ServeHTTP(bad, httptest.NewRequest(http.MethodGet, "/api/v1/creators?limit=101", nil))
	if bad.Code != http.StatusBadRequest {
		t.Fatalf("invalid pagination status = %d, want 400", bad.Code)
	}
	if repo.listCalls != 1 {
		t.Fatalf("invalid request reached repository: listCalls=%d", repo.listCalls)
	}
}

func TestHandlerGetPublicCreatorAnd404(t *testing.T) {
	gin.SetMode(gin.TestMode)
	repo := &publicCreatorRepoStub{creator: creatorFixture()}
	handler := NewHandler(NewService(repo), nil)
	router := gin.New()
	router.GET("/api/v1/creators/:id", handler.GetPublicCreator)

	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, httptest.NewRequest(http.MethodGet, "/api/v1/creators/7", nil))
	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d body=%s", recorder.Code, recorder.Body.String())
	}

	repo.creator = nil
	repo.getErr = sql.ErrNoRows
	missing := httptest.NewRecorder()
	router.ServeHTTP(missing, httptest.NewRequest(http.MethodGet, "/api/v1/creators/999", nil))
	if missing.Code != http.StatusNotFound {
		t.Fatalf("missing status = %d body=%s", missing.Code, missing.Body.String())
	}
}
