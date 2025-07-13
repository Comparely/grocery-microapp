package searchv2

import (
	"context"
	"fmt"
	"log"
	"math"
	"os"
	"sort"

	"github.com/sashabaranov/go-openai"
)

const (
	editThreshold   = 0.4
	vectorThreshold = 0.60
)

// mergeProducts with vector embeddings (Not using this for now as our DP approach was better and saves $)
func mergeProductsVector(raw []RawProduct) []Product {
	useVector := true
	client := openai.NewClient(os.Getenv("OPEN_AI_KEY"))

	groups := [][]RawProduct{}
	labels := []string{}
	var labelEmbs [][]float64

	for _, rp := range raw {
		norm := normalizeName(rp.Name)

		// get embedding if vector‐mode
		var rpEmb []float64
		if useVector {
			var err error
			rpEmb, err = getOpenAIEmbedding(client, norm)
			if err != nil {
				log.Printf("embed error, falling back: %v", err)
				useVector = false
			}
		}

		placed := false
		for i, lbl := range labels {
			if useVector {
				if cosineSim(labelEmbs[i], rpEmb) >= vectorThreshold {
					groups[i] = append(groups[i], rp)
					placed = true
					break
				}
			} else {
				if isSimilar(norm, lbl, editThreshold) {
					groups[i] = append(groups[i], rp)
					placed = true
					break
				}
			}
		}
		if !placed {
			groups = append(groups, []RawProduct{rp})
			labels = append(labels, norm)
			if useVector {
				labelEmbs = append(labelEmbs, rpEmb)
			}
		}
	}

	products := collapseClusters(groups)

	// sort by platform count
	sort.Slice(products, func(i, j int) bool {
		return len(products[i].Prices) > len(products[j].Prices)
	})
	return products
}

// getOpenAIEmbedding calls the OpenAI Embeddings API
func getOpenAIEmbedding(client *openai.Client, text string) ([]float64, error) {
	resp, err := client.CreateEmbeddings(
		context.Background(),
		openai.EmbeddingRequest{
			Model: openai.AdaEmbeddingV2,
			Input: []string{text},
		},
	)
	if err != nil {
		return nil, err
	}
	if len(resp.Data) == 0 {
		return nil, fmt.Errorf("no embedding returned")
	}
	// Convert []float32 to []float64
	emb32 := resp.Data[0].Embedding
	emb64 := make([]float64, len(emb32))
	for i, v := range emb32 {
		emb64[i] = float64(v)
	}
	return emb64, nil
}

// cosineSim returns the cosine similarity of two vectors.
// assumes same length.
func cosineSim(a, b []float64) float64 {
	var (
		dot, magA, magB float64
	)
	for i := range a {
		dot += a[i] * b[i]
		magA += a[i] * a[i]
		magB += b[i] * b[i]
	}
	if magA == 0 || magB == 0 {
		return 0
	}
	return dot / (math.Sqrt(magA) * math.Sqrt(magB))
}
