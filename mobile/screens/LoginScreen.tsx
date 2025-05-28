// screens/LoginScreen.tsx
import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { useWebViews } from '../context/WebViewContext'; // adjust path if needed

export default function LoginScreen() {
    const { blinkitWebViewRef, zeptoWebViewRef } = useWebViews();
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState({ blinkit: '', zepto: '' });
    const [step, setStep] = useState<'phone' | 'otp'>('phone');

    const sendPhone = () => {
        if (phone.length === 10) {
            blinkitWebViewRef.current?.injectPhoneNumber(phone);
            zeptoWebViewRef.current?.injectPhoneNumber(phone);
            setStep('otp');
        } else {
            Alert.alert('Invalid Phone Number');
        }
    };

    const sendOtp = () => {
        blinkitWebViewRef.current?.injectOtp(otp.blinkit);
        zeptoWebViewRef.current?.injectOtp(otp.zepto);
    };

    return (
        <View style={styles.container}>
            {step === 'phone' ? (
                <>
                    <TextInput
                        placeholder="Enter phone number"
                        keyboardType="phone-pad"
                        maxLength={10}
                        style={styles.input}
                        onChangeText={setPhone}
                        value={phone}
                    />
                    <Button title="Send OTP" onPress={sendPhone} />
                </>
            ) : (
                <>
                    <TextInput
                        placeholder="Enter Blinkit OTP"
                        keyboardType="number-pad"
                        maxLength={4}
                        style={styles.input}
                        onChangeText={(text) => setOtp((prev) => ({ ...prev, blinkit: text }))}
                        value={otp.blinkit}
                    />
                    <TextInput
                        placeholder="Enter Zepto OTP"
                        keyboardType="number-pad"
                        maxLength={6}
                        style={styles.input}
                        onChangeText={(text) => setOtp((prev) => ({ ...prev, zepto: text }))}
                        value={otp.zepto}
                    />
                    <Button title="Login" onPress={sendOtp} />
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        flex: 1,
        justifyContent: 'center',
        backgroundColor: 'white',
    },
    input: {
        borderWidth: 1,
        padding: 10,
        marginBottom: 10,
        borderRadius: 5,
        borderColor: '#ccc',
    },
});
