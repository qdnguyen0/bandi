package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/bandiAI/internal/middleware"
	"github.com/bandiAI/internal/models"
	"github.com/bandiAI/internal/storage"
	"github.com/golang-jwt/jwt/v5"
)

type AuthHandler struct {
	db        *storage.DB
	jwtSecret string
}

func NewAuthHandler(db *storage.DB, jwtSecret string) *AuthHandler {
	return &AuthHandler{db: db, jwtSecret: jwtSecret}
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req models.RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "invalid request body", http.StatusBadRequest)
		return
	}
	if req.Email == "" || req.Password == "" || req.Username == "" {
		jsonError(w, "username, email and password required", http.StatusBadRequest)
		return
	}
	if req.Role == "" {
		req.Role = "user"
	}
	if req.Role != "user" && req.Role != "dev" {
		jsonError(w, "role must be 'user' or 'dev'", http.StatusBadRequest)
		return
	}

	user, err := h.db.CreateUser(req.Username, req.Email, req.Password, req.FirstName, req.LastName, req.Role)
	if err != nil {
		jsonError(w, "username or email already exists", http.StatusConflict)
		return
	}

	token, err := h.generateToken(user)
	if err != nil {
		jsonError(w, "internal error", http.StatusInternalServerError)
		return
	}

	jsonResp(w, http.StatusCreated, models.AuthResponse{Token: token, User: *user})
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req models.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "invalid request body", http.StatusBadRequest)
		return
	}

	user, err := h.db.GetUserByUsername(req.Username)
	if err != nil {
		jsonError(w, "invalid credentials", http.StatusUnauthorized)
		return
	}

	if user.Password != req.Password {
		jsonError(w, "invalid credentials", http.StatusUnauthorized)
		return
	}

	token, err := h.generateToken(user)
	if err != nil {
		jsonError(w, "internal error", http.StatusInternalServerError)
		return
	}

	jsonResp(w, http.StatusOK, models.AuthResponse{Token: token, User: *user})
}

func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	user, err := h.db.GetUserByID(userID)
	if err != nil {
		jsonError(w, "user not found", http.StatusNotFound)
		return
	}
	jsonResp(w, http.StatusOK, user)
}

type ProfileResponse struct {
	User        models.User       `json:"user"`
	Purchases   []models.Purchase `json:"purchases"`
	FavoriteIDs []int64           `json:"favorite_ids"`
}

func (h *AuthHandler) Profile(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	user, err := h.db.GetUserByID(userID)
	if err != nil {
		jsonError(w, "user not found", http.StatusNotFound)
		return
	}

	purchases, err := h.db.GetUserPurchases(userID)
	if err != nil {
		purchases = []models.Purchase{}
	}

	favorites, err := h.db.GetUserFavorites(userID)
	if err != nil {
		favorites = []int64{}
	}

	jsonResp(w, http.StatusOK, ProfileResponse{
		User:        *user,
		Purchases:   purchases,
		FavoriteIDs: favorites,
	})
}

func (h *AuthHandler) CheckUsername(w http.ResponseWriter, r *http.Request) {
	username := r.URL.Query().Get("username")
	if username == "" {
		jsonError(w, "username required", http.StatusBadRequest)
		return
	}
	exists, err := h.db.UsernameExists(username)
	if err != nil {
		jsonError(w, "internal error", http.StatusInternalServerError)
		return
	}
	jsonResp(w, http.StatusOK, map[string]bool{"taken": exists})
}

func (h *AuthHandler) CheckEmail(w http.ResponseWriter, r *http.Request) {
	email := r.URL.Query().Get("email")
	if email == "" {
		jsonError(w, "email required", http.StatusBadRequest)
		return
	}
	exists, err := h.db.EmailExists(email)
	if err != nil {
		jsonError(w, "internal error", http.StatusInternalServerError)
		return
	}
	jsonResp(w, http.StatusOK, map[string]bool{"taken": exists})
}

func (h *AuthHandler) generateToken(user *models.User) (string, error) {
	claims := jwt.MapClaims{
		"sub":  user.ID,
		"role": user.Role,
		"exp":  time.Now().Add(72 * time.Hour).Unix(),
		"iat":  time.Now().Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(h.jwtSecret))
}
