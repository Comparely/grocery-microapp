import type React from "react"
import { StyleSheet, View, Text, Image, Linking, TouchableOpacity } from "react-native"
import type { Product, PriceOption } from "../types/Product"

interface ProductCardProps {
  product: Product
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {

  // Find the cheapest and fastest options
  const cheapestOption = product.priceOptions.reduce(
    (prev, current) => (prev.price < current.price ? prev : current),
    product.priceOptions[0],
  )

  const fastestOption = product.priceOptions.reduce(
    (prev, current) => (prev.deliveryTime < current.deliveryTime ? prev : current),
    product.priceOptions[0],
  )

  // Check if cheapest is also fastest
  const isCheapestAlsoFastest = cheapestOption.id === fastestOption.id

  return (
    <View style={styles.container}>
      {/* Product Image */}
      <View style={styles.imageContainer}>
        {product.isNewPack && (
          <View style={styles.newPackBadge}>
            <Text style={styles.newPackText}>NOW IN NEW PACK</Text>
          </View>
        )}
        <Image source={{ uri: product.imageUrl }} style={styles.image} />
      </View>

      {/* Product Details */}
      <View style={styles.detailsContainer}>
        {/* Weight and Brand */}
        <View style={styles.tagsContainer}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{product.brand}</Text>
          </View>
        </View>

        {/* MRP */}
        <Text style={styles.mrpText}>MRP ₹{product.mrp}</Text>

        {/* Product Name */}
        <Text style={styles.nameText} numberOfLines={2}>
          {product.name}
        </Text>

        {/* Price Options */}
        {
          product.priceOptions.map(priceOption => 
            <PriceOptionSingle key={priceOption.id} priceOption={priceOption} label="" />
          )
        }
        {/* {isCheapestAlsoFastest ? (
          <PriceOptionSingle priceOption={cheapestOption} label="Cheapest & Fastest" />
        ) : (
          <PriceOptionDouble cheapestOption={cheapestOption} fastestOption={fastestOption} />
        )} */}
      </View>
    </View>
  )
}

interface PriceOptionSingleProps {
  priceOption: PriceOption
  label: string
}

const PriceOptionSingle: React.FC<PriceOptionSingleProps> = ({ priceOption, label }) => {


  const handleDeepLink = async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      console.log("Don't know how to open URI: " + url);
    }
  };

  return (
    <TouchableOpacity onPress={() => handleDeepLink(priceOption.deeplink)} style={styles.priceOptionContainer}>
      <View>
        <Text style={styles.optionLabel}>{label}</Text>
        <View style={styles.priceContainer}>
          <Text style={styles.priceText}>₹{priceOption.price}</Text>
          <View style={[styles.platformBadge]}>
            {
              priceOption.platform == "zepto" && <Image source={require('@/assets/images/zepto.svg')} />
            }
            {
              priceOption.platform == "blinkit" && <Image source={require('@/assets/images/blinkit.svg')} />
            }
            {
              priceOption.platform == "instamart" && <Image source={require('@/assets/images/instamart.png')} />
            }

            <View style={styles.tagSmall}>
              <Text style={styles.tagTextSmall}>{priceOption.weight}</Text>
            </View>
          </View>
        </View>
        <View style={styles.deliveryContainer}>
          <View style={styles.deliveryDot}>
            <View style={styles.deliveryDotInner} />
          </View>
          <Text style={styles.deliveryText}>{priceOption.deliveryTime} mins</Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

interface PriceOptionDoubleProps {
  cheapestOption: PriceOption
  fastestOption: PriceOption
}

const PriceOptionDouble: React.FC<PriceOptionDoubleProps> = ({ cheapestOption, fastestOption }) => {
  return (
    <View>
      <View style={styles.optionsLabelContainer}>
        <Text style={styles.optionLabel}>Cheapest</Text>
        <Text style={styles.optionLabel}>Fastest</Text>
      </View>
      <View style={styles.optionsContainer}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceText}>₹{cheapestOption.price}</Text>
          <View style={[styles.platformBadge, { backgroundColor: getPlatformColor(cheapestOption.platform) }]}>
            <Text style={[styles.platformText, { color: getPlatformTextColor(cheapestOption.platform) }]}>
              {cheapestOption.platform}
            </Text>
          </View>
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.priceText}>₹{fastestOption.price}</Text>
          <View style={[styles.platformBadge, { backgroundColor: getPlatformColor(fastestOption.platform) }]}>
            <Text style={[styles.platformText, { color: getPlatformTextColor(fastestOption.platform) }]}>
              {fastestOption.platform}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.optionsContainer}>
        <View style={styles.deliveryContainer}>
          <View style={styles.deliveryDot}>
            <View style={styles.deliveryDotInner} />
          </View>
          <Text style={styles.deliveryText}>{cheapestOption.deliveryTime} mins</Text>
        </View>
        <View style={styles.deliveryContainer}>
          <View style={styles.deliveryDot}>
            <View style={styles.deliveryDotInner} />
          </View>
          <Text style={styles.deliveryText}>{fastestOption.deliveryTime} mins</Text>
        </View>
      </View>
    </View>
  )
}

// Helper function to get platform badge color
const getPlatformColor = (platform: string): string => {
  switch (platform.toLowerCase()) {
    case "zepto":
      return "#6f1ab6"
    case "blinkit":
      return "#cbd402"
    default:
      return "#cbd402"
  }
}

// Helper function to get platform text color
const getPlatformTextColor = (platform: string): string => {
  switch (platform.toLowerCase()) {
    case "zepto":
      return "#ffffff"
    case "blinkit":
      return "#181b19"
    default:
      return "#181b19"
  }
}

const styles = StyleSheet.create({
  container: {
    width: "48%",
    marginBottom: 16,
  },
  imageContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    height: 180,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    position: "relative",
  },
  newPackBadge: {
    position: "absolute",
    top: 0,
    left: 0,
    backgroundColor: "red",
    borderTopLeftRadius: 12,
    borderBottomRightRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  newPackText: {
    color: "white",
    fontSize: 8,
    fontWeight: "bold",
  },
  image: {
    width: "80%",
    height: "80%",
    resizeMode: "contain",
  },
  detailsContainer: {
    paddingHorizontal: 4,
  },
  tagsContainer: {
    flexDirection: "row",
    marginBottom: 6,
  },
  tag: {
    backgroundColor: "#fde5b6",
    borderRadius: 50,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
  },
  tagSmall: {
    backgroundColor: "#fde5b6",
    borderRadius: 50,
    paddingHorizontal: 8,
    paddingVertical: 1,
    marginRight: 8,
  },
  tagText: {
    color: "#181b19",
    fontSize: 12,
    fontWeight: "500",
  },
  tagTextSmall: {
    color: "#181b19",
    fontSize: 10,
    fontWeight: "500",
  },
  mrpText: {
    color: "#9d9d9d",
    fontSize: 12,
    marginBottom: 4,
  },
  nameText: {
    color: "#181b19",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    lineHeight: 20,
  },
  optionsLabelContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  optionLabel: {
    color: "#004738",
    fontSize: 12,
    fontWeight: "500",
  },
  optionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  priceText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#181b19",
    marginRight: 4,
  },
  platformBadge: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    display: "flex",
    flexDirection: "row",
    columnGap: 8
  },
  platformText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  deliveryContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  deliveryDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#ffeb3b",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 4,
  },
  deliveryDotInner: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#ffa000",
  },
  deliveryText: {
    fontSize: 12,
    color: "#181b19",
  },
  priceOptionContainer: {
    display: "flex",
    flexDirection: "row",
    rowGap: 8
  }
})

