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
	prompt.WriteString("Write a 3-sentence marketplace summary for a potential buyer of this AI agent.\n")
	prompt.WriteString("Sentence 1: What it does. Sentence 2: The rating (state the exact number out of 5 and review count) and whether that's excellent/good/mixed/poor. Sentence 3: Overall review sentiment — what users praise and any common complaints.\n")
	prompt.WriteString("Do NOT quote or name individual reviewers. Do NOT use bullet points or headers. Plain prose only.\n\n")
	prompt.WriteString(fmt.Sprintf("Agent Description: %s\n", req.Description))
	prompt.WriteString(fmt.Sprintf("Overall Rating: %.1f out of 5 (%d reviews)\n", req.Rating, req.ReviewCount))
	if len(req.Comments) > 0 {
		comments := req.Comments
		if len(comments) > 15 {
			comments = comments[:15]
		}
		prompt.WriteString("\nSample User Reviews:\n")
		for _, c := range comments {
			prompt.WriteString(fmt.Sprintf("- %.0f/5: \"%s\"\n", c.Rating, c.Text))
		}
	}

	body := geminiRequest{
		Contents: []geminiContent{
			{Parts: []geminiPart{{Text: prompt.String()}}},
		},
		GenerationConfig: geminiGenerationConfig{MaxOutputTokens: 2048},
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
