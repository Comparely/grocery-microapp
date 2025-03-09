import { SafeAreaView, StatusBar, StyleSheet } from "react-native"
import { GroceryComparisonScreen } from "../screens/GroceryComparisonScreen"

const App = () => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#004738" />
      <GroceryComparisonScreen />
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

