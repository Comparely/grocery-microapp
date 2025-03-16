import { SafeAreaView, StatusBar, StyleSheet } from "react-native"
import { GroceryComparisonScreen } from "../screens/GroceryComparisonScreen"
import HomeScreen from "@/screens/HomeScreen"

const App = () => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#004738" />
      <HomeScreen />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#004738",
  },
})

export default App

