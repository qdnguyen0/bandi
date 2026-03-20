package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
)

type SummaryHandler struct {
	apiKey string
}

func NewSummaryHandler(apiKey string) *SummaryHandler {
	return &SummaryHandler{apiKey: apiKey}
}

type summaryRequest struct {
	Description string           `json:"description"`
	Rating      float64          `json:"rating"`
	ReviewCount int              `json:"review_count"`
	Comments    []summaryComment `json:"comments"`
}

type summaryComment struct {
	User   string  `json:"user"`
	Text   string  `json:"text"`
	Rating float64 `json:"rating"`
}

type geminiRequest struct {
	Contents         []geminiContent        `json:"contents"`
	GenerationConfig geminiGenerationConfig `json:"generationConfig"`
}

type geminiContent struct {
	Parts []geminiPart `json:"parts"`
}

type geminiPart struct {
	Text string `json:"text"`
}

type geminiGenerationConfig struct {
	MaxOutputTokens int `json:"maxOutputTokens"`
}

type geminiResponse struct {
	Candidates []struct {
		Content struct {
			Parts []struct {
				Text string `json:"text"`
			} `json:"parts"`
		} `json:"content"`
	} `json:"candidates"`
	Error *struct {
		Message string `json:"message"`
	} `json:"error"`
}

func (h *SummaryHandler) Generate(w http.ResponseWriter, r *http.Request) {
	if h.apiKey == "" {
		jsonError(w, "Gemini API key not configured", http.StatusServiceUnavailable)
		return
	}

	var req summaryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "invalid request body", http.StatusBadRequest)
		return
	}

	var prompt strings.Builder
	prompt.WriteString("Write a concise marketplace summary of this AI agent for a potential buyer in 3-4 sentences.\n")
	prompt.WriteString("Cover what it does, mention the rating, and describe the general sentiment from user reviews (don't summarize individual comments).\n\n")
	prompt.WriteString(fmt.Sprintf("Agent Description: %s\n", req.Description))
	prompt.WriteString(fmt.Sprintf("Overall Rating: %.1f out of 5 (%d reviews)\n", req.Rating, req.ReviewCount))
	if len(req.Comments) > 0 {
		prompt.WriteString("\nUser Reviews:\n")
		for _, c := range req.Comments {
			prompt.WriteString(fmt.Sprintf("- %s rated it %.0f/5: \"%s\"\n", c.User, c.Rating, c.Text))
		}
	}

	body := geminiRequest{
		Contents: []geminiContent{
			{Parts: []geminiPart{{Text: prompt.String()}}},
		},
		GenerationConfig: geminiGenerationConfig{MaxOutputTokens: 512},
	}

	reqBody, err := json.Marshal(body)
	if err != nil {
		jsonError(w, "failed to build request", http.StatusInternalServerError)
		return
	}

	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=%s", h.apiKey)
	httpReq, err := http.NewRequestWithContext(r.Context(), http.MethodPost, url, bytes.NewReader(reqBody))
	if err != nil {
		jsonError(w, "failed to create request", http.StatusInternalServerError)
		return
	}
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(httpReq)
	if err != nil {
		jsonError(w, "failed to call Gemini API", http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		jsonError(w, "failed to read API response", http.StatusBadGateway)
		return
	}

	if resp.StatusCode != http.StatusOK {
		jsonError(w, fmt.Sprintf("Gemini API error (status %d)", resp.StatusCode), http.StatusBadGateway)
		return
	}

	var geminiResp geminiResponse
	if err := json.Unmarshal(respBody, &geminiResp); err != nil {
		jsonError(w, "failed to parse API response", http.StatusBadGateway)
		return
	}

	if len(geminiResp.Candidates) == 0 || len(geminiResp.Candidates[0].Content.Parts) == 0 {
		jsonError(w, "empty response from Gemini API", http.StatusBadGateway)
		return
	}

	jsonResp(w, http.StatusOK, map[string]string{
		"summary": geminiResp.Candidates[0].Content.Parts[0].Text,
	})
}
