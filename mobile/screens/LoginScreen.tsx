import { Ionicons } from '@expo/vector-icons';
import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    KeyboardAvoidingView,
    NativeSyntheticEvent,
    TextInputKeyPressEventData,
    Alert,
} from 'react-native';
import { useWebViews } from '../context/WebViewContext';

interface LoginScreenProps {
    platform: 'blinkit' | 'zepto';
}

const platformOtpLength: Record<'blinkit' | 'zepto', number> = {
    blinkit: 4,
    zepto: 6,
};

const LoginScreen: React.FC<LoginScreenProps> = ({ platform }) => {
    const [step, setStep] = useState<'phone' | 'otp'>('phone');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState<string[]>([]);
    const inputsRef = useRef<Array<TextInput | null>>([]);
    const { blinkitWebViewRef, zeptoWebViewRef } = useWebViews();
    const otpLength = platformOtpLength[platform];

    useEffect(() => {
        if (step === 'otp') {
            setOtp(new Array(otpLength).fill(''));
            setTimeout(() => {
                inputsRef.current[0]?.focus();
            }, 100);
        }
    }, [step]);

    useEffect(() => {
        const joinedOtp = otp.join('');
        if (joinedOtp.length === otpLength && !otp.includes('')) {
            sendOtp();
        }
    }, [otp]);

    const handlePhoneSubmit = () => {
        if (phoneNumber.length === 10) {
            switch (platform) {
                case 'blinkit':
                    blinkitWebViewRef.current?.injectPhoneNumber(phoneNumber);
                    break;
                case 'zepto':
                    zeptoWebViewRef.current?.injectPhoneNumber(phoneNumber);
                    break;
            }
            setStep('otp');
        } else {
            Alert.alert('Invalid Phone Number');
        }
    };

    const sendOtp = () => {
        const joined = otp.join('');
        console.log(`Sending OTP: ${joined}`);
        switch (platform) {
            case 'blinkit':
                blinkitWebViewRef.current?.injectOtp(joined);
                break;
            case 'zepto':
                zeptoWebViewRef.current?.injectOtp(joined);
                break;
        }
    };

    const handleOtpChange = (text: string, index: number) => {
        if (isNaN(Number(text))) return;

        const newOtp = [...otp];
        newOtp[index] = text.slice(-1);
        setOtp(newOtp);

        if (text && index < otpLength - 1) {
            inputsRef.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            const newOtp = [...otp];
            newOtp[index - 1] = '';
            setOtp(newOtp);
            inputsRef.current[index - 1]?.focus();
        }
    };

    const renderPhoneInput = () => (
        <>
            <Text style={styles.heading}>Almost There!</Text>
            <Text style={styles.subheading}>
                Let’s Get You the Best Deal{'\n'}on Your Next Meal!
            </Text>

            <View style={styles.inputWrapper}>
                <View style={styles.staticCodeBox}>
                    <Text style={styles.codeText}>+91</Text>
                </View>

                <TextInput
                    style={styles.input}
                    placeholder="Enter phone number"
                    placeholderTextColor="#888"
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                />
            </View>

            <TouchableOpacity style={styles.button} onPress={handlePhoneSubmit}>
                <Text style={styles.buttonText}>Continue</Text>
            </TouchableOpacity>
        </>
    );

    const renderOtpInput = () => (
        <>
            <TouchableOpacity onPress={() => setStep('phone')} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#004225" />
            </TouchableOpacity>

            <Text style={styles.heading}>You're One Step Away!</Text>
            <Text style={styles.subheading}>Enter the OTP to Grab{'\n'}Your Best Deal!</Text>

            <View style={styles.otpWrapper}>
                {otp.map((digit, index) => (
                    <TextInput
                        key={index}
                        ref={(ref) => (inputsRef.current[index] = ref)}
                        style={styles.otpInput}
                        keyboardType="number-pad"
                        maxLength={1}
                        value={digit}
                        placeholder=""
                        onChangeText={(text) => handleOtpChange(text, index)}
                        onKeyPress={(e) => handleKeyDown(e, index)}
                    />
                ))}
            </View>

            <TouchableOpacity onPress={() => setOtp(new Array(otpLength).fill(''))}>
                <Text style={styles.resend}>Resend Code</Text>
            </TouchableOpacity>
        </>
    );

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior="padding" style={styles.innerContainer}>
                {step === 'phone' ? renderPhoneInput() : renderOtpInput()}
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default LoginScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fef8e9',
    },
    innerContainer: {
        padding: 24,
        paddingTop: 40,
    },
    heading: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#004225',
        marginBottom: 8,
    },
    subheading: {
        fontSize: 16,
        color: '#333',
        marginBottom: 36,
        lineHeight: 22,
    },
    inputWrapper: {
        flexDirection: 'row',
        marginBottom: 28,
    },
    staticCodeBox: {
        width: 70,
        height: 50,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    codeText: {
        fontSize: 16,
        color: '#000',
    },
    input: {
        flex: 1,
        height: 50,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        paddingHorizontal: 12,
        fontSize: 16,
        color: '#000',
    },
    button: {
        backgroundColor: '#d6e429',
        paddingVertical: 16,
        borderRadius: 10,
        alignItems: 'center',
    },
    buttonText: {
        fontWeight: '600',
        fontSize: 18,
        color: '#003300',
    },
    otpWrapper: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    otpInput: {
        width: 45,
        height: 50,
        borderWidth: 1,
        borderColor: '#222',
        borderRadius: 6,
        textAlign: 'center',
        fontSize: 20,
        color: '#000',
    },
    resend: {
        color: '#004225',
        textAlign: 'center',
        fontWeight: '600',
        fontSize: 14,
    },
    backButton: {
        marginBottom: 10,
    },
    backArrow: {
        fontSize: 26,
        color: '#004225',
    },
});
