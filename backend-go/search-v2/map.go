package searchv2

import (
	"math"
	"sort"
	"strings"
	"unicode"
)

// mergeProducts takes a slice of RawProduct from various platforms
// and returns a deduped slice of Product with price‐comparison info.
func mergeProducts(rawProducts []RawProduct) []Product {
	if len(rawProducts) == 0 {
		return nil
	}

	// 1) cluster by “similar” name
	groups := [][]RawProduct{}
	labels := []string{}
	const threshold = 0.4

	for _, rp := range rawProducts {
		matched := false
		for i, lbl := range labels {
			if isSimilar(rp.Name, lbl, threshold) {
				groups[i] = append(groups[i], rp)
				matched = true
				break
			}
		}
		if !matched {
			groups = append(groups, []RawProduct{rp})
			labels = append(labels, rp.Name)
		}
	}

	// 2) collapse clusters into Products
	products := collapseClusters(groups)

	// 3) sort by how many platforms each product appears on (desc)
	sort.Slice(products, func(i, j int) bool {
		return len(products[i].Prices) > len(products[j].Prices)
	})

	return products
}

func collapseClusters(groups [][]RawProduct) []Product {
	products := make([]Product, 0, len(groups))
	for _, grp := range groups {
		first := grp[0]

		// find cheapest variant → MRP + weight
		cheapest := math.MaxFloat64
		chosenWeight := first.Variants[0].Weight
		for _, rp := range grp {
			for _, v := range rp.Variants {
				if v.OriginalPrice < cheapest {
					cheapest = v.OriginalPrice
					chosenWeight = v.Weight
				}
			}
		}

		// bucket all variants by platform
		platformMap := map[string][]Variant{}
		order := []string{}
		for _, rp := range grp {
			if _, seen := platformMap[rp.Platform]; !seen {
				order = append(order, rp.Platform)
			}
			for _, v := range rp.Variants {
				platformMap[rp.Platform] = append(platformMap[rp.Platform], Variant{
					OriginalPrice:   v.OriginalPrice,
					DiscountedPrice: v.DiscountedPrice,
					Deeplink:        v.Deeplink,
					ImageURL:        v.ImageURL,
					Weight:          v.Weight,
				})
			}
		}

		// build PriceOption slice in stable order
		priceOpts := make([]PriceOption, len(order))
		for i, plat := range order {
			priceOpts[i] = PriceOption{
				Source:   plat,
				Variants: platformMap[plat],
			}
		}

		products = append(products, Product{
			ID:       slugify(first.Name),
			Name:     first.Name,
			Brand:    first.Brand,
			Weight:   chosenWeight,
			MRP:      cheapest,
			ImageURL: first.ImageURL,
			Prices:   priceOpts,
		})
	}
	return products
}

// normalizeName lowercases, strips punctuation, and collapses whitespace.
func normalizeName(s string) string {
	s = strings.ToLower(s)
	s = strings.Map(func(r rune) rune {
		if unicode.IsLetter(r) || unicode.IsNumber(r) || unicode.IsSpace(r) {
			return r
		}
		return -1
	}, s)
	return strings.Join(strings.Fields(s), " ")
}

// isSimilar returns true if names a and b differ by less than threshold fraction.
func isSimilar(a, b string, threshold float64) bool {
	na := normalizeName(a)
	nb := normalizeName(b)
	if na == nb {
		return true
	}
	dist := levenshteinDistance(na, nb)
	maxLen := len(na)
	if len(nb) > maxLen {
		maxLen = len(nb)
	}
	if maxLen == 0 {
		return true
	}
	return float64(dist)/float64(maxLen) < threshold
}

// basic Levenshtein distance (DP with O(min(|a|,|b|)) space)
func levenshteinDistance(a, b string) int {
	la, lb := len(a), len(b)
	if la == 0 {
		return lb
	}
	if lb == 0 {
		return la
	}
	// ensure we iterate on the shorter second string
	if lb < la {
		a, b = b, a
		la, lb = lb, la
	}
	prev := make([]int, lb+1)
	curr := make([]int, lb+1)
	for j := range prev {
		prev[j] = j
	}
	for i := 1; i <= la; i++ {
		curr[0] = i
		for j := 1; j <= lb; j++ {
			cost := 1
			if a[i-1] == b[j-1] {
				cost = 0
			}
			curr[j] = min(
				prev[j]+1,      // deletion
				curr[j-1]+1,    // insertion
				prev[j-1]+cost, // substitution
			)
		}
		prev, curr = curr, prev
	}
	return prev[lb]
}

func min(vals ...int) int {
	m := vals[0]
	for _, v := range vals[1:] {
		if v < m {
			m = v
		}
	}
	return m
}
