import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../lib/supabase';
import { AuthError, User } from '../types';
import { CaregiverService } from '../lib/caregiverService';

interface AuthScreenProps {
  onLogin: (user: User) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = React.useState(true);
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phoneNumber, setPhoneNumber] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [userType, setUserType] = React.useState<'hire' | 'offer'>('hire');
  const [isLoading, setIsLoading] = React.useState(false);
  const [seniorEmail, setSeniorEmail] = React.useState('');
  const [showSeniorEmailInput, setShowSeniorEmailInput] = React.useState(false);

  const handleAuth = async () => {
    if (isLogin) {
      // Login validation
      if (!email || !password) {
        Alert.alert('Error', 'Please fill in email and password');
        return;
      }
      
      setIsLoading(true);
      try {
        const { data, error } = await auth.signIn(email, password);
        
        if (error) {
          Alert.alert('Login Failed', error.message || 'An error occurred during login');
          return;
        }
        
        if (data?.user) {
          const loggedInUserType = data.user.user_metadata?.userType || 'hire';
          
          // If user is a caregiver, ask for senior email
          if (loggedInUserType === 'offer') {
            setShowSeniorEmailInput(true);
            setIsLoading(false);
            return; // Don't proceed with login yet, wait for senior email
          }
          
          // Convert Supabase user to our User type
          const userData: User = {
            id: data.user.id,
            firstName: data.user.user_metadata?.firstName || '',
            lastName: data.user.user_metadata?.lastName || '',
            email: data.user.email || '',
            phoneNumber: data.user.user_metadata?.phoneNumber,
            userType: loggedInUserType
          };
          
          Alert.alert('Success', 'Login successful!', [
            { text: 'OK', onPress: () => onLogin(userData) }
          ]);
        }
      } catch (error) {
        Alert.alert('Error', 'An unexpected error occurred during login');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Signup validation
      if (!firstName || !lastName || !email || !password || !confirmPassword) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }
      
      if (password !== confirmPassword) {
        Alert.alert('Error', 'Passwords do not match');
        return;
      }
      
      if (password.length < 6) {
        Alert.alert('Error', 'Password must be at least 6 characters');
        return;
      }
      
      setIsLoading(true);
      try {
        const { data, error } = await auth.signUp(email, password, {
          firstName,
          lastName,
          phoneNumber: phoneNumber || undefined,
          userType
        });
        
        if (error) {
          Alert.alert('Registration Failed', error.message || 'An error occurred during registration');
          return;
        }
        
        if (data?.user) {
          Alert.alert(
            'Registration Successful', 
            'Please check your email to verify your account before signing in.',
            [
              { text: 'OK', onPress: () => setIsLogin(true) }
            ]
          );
        }
      } catch (error) {
        Alert.alert('Error', 'An unexpected error occurred during registration');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSeniorEmailSubmit = async () => {
    if (!seniorEmail || !email || !password) {
      Alert.alert('Error', 'Please enter the senior\'s email address');
      return;
    }

    setIsLoading(true);
    try {
      // Find senior user by email
      const seniorResult = await CaregiverService.findSeniorByEmail(seniorEmail.trim());
      
      if (!seniorResult.success || !seniorResult.userId) {
        Alert.alert(
          'Senior Not Found',
          seniorResult.error || 'Could not find a user with that email. Please ensure the senior has an account.',
          [
            { text: 'OK', onPress: () => setIsLoading(false) }
          ]
        );
        return;
      }

      // Get current user (we already logged in)
      const { data: userData } = await auth.getCurrentUser();
      
      if (!userData?.user) {
        Alert.alert('Error', 'Could not retrieve user information');
        setIsLoading(false);
        return;
      }

      // Request caregiver access (creates pending relationship)
      const requestResult = await CaregiverService.requestAccess(
        seniorEmail.trim(),
        userData.user.id,
        userData.user.email || ''
      );

      if (!requestResult.success) {
        Alert.alert(
          'Request Failed',
          requestResult.error || 'Could not create access request. The senior may need to approve your request first.',
          [
            { text: 'OK', onPress: () => setIsLoading(false) }
          ]
        );
        return;
      }

      // Verify access (check if already approved)
      const verifyResult = await CaregiverService.verifyAccess(
        userData.user.id,
        seniorEmail.trim()
      );

      if (verifyResult.success && verifyResult.relationship) {
        // Already approved - proceed with login
        const user: User = {
          id: userData.user.id,
          firstName: userData.user.user_metadata?.firstName || '',
          lastName: userData.user.user_metadata?.lastName || '',
          email: userData.user.email || '',
          phoneNumber: userData.user.user_metadata?.phoneNumber,
          userType: userData.user.user_metadata?.userType || 'offer',
          seniorEmail: verifyResult.relationship.senior_email,
          seniorUserId: verifyResult.relationship.senior_id || undefined
        };
        
        Alert.alert('Success', 'Access approved! Connected to senior account.', [
          { text: 'OK', onPress: () => {
            setShowSeniorEmailInput(false);
            onLogin(user);
          }}
        ]);
      } else {
        // Pending approval - show message
        Alert.alert(
          'Access Request Sent',
          `A request has been sent to ${seniorEmail.trim()}. The senior will need to approve your access before you can view their information.\n\nVerification Code: ${requestResult.verificationCode}\n\nPlease ask the senior to approve your request or provide this code for verification.`,
          [
            { 
              text: 'OK', 
              onPress: () => {
                setShowSeniorEmailInput(false);
                setSeniorEmail('');
                // Show pending access message
                Alert.alert(
                  'Pending Approval',
                  'You will be able to access the dashboard once the senior approves your request.',
                  [
                    { text: 'OK', onPress: () => {
                      // Still log them in but show limited access
                      const user: User = {
                        id: userData.user.id,
                        firstName: userData.user.user_metadata?.firstName || '',
                        lastName: userData.user.user_metadata?.lastName || '',
                        email: userData.user.email || '',
                        phoneNumber: userData.user.user_metadata?.phoneNumber,
                        userType: userData.user.user_metadata?.userType || 'offer',
                        seniorEmail: seniorEmail.trim(),
                      };
                      onLogin(user);
                    }}
                  ]
                );
              }
            }
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred while connecting to senior account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.container}
    >
      <StatusBar style="light" />
      
      {/* Back Button */}
      {!isLogin && (
        <View style={styles.backButtonContainer}>
          <TouchableOpacity onPress={() => setIsLogin(true)} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}
      
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.logo}>EnabledAi</Text>
          <Text style={styles.welcomeText}>
            {isLogin ? 'Welcome Back!' : 'Create Account'}
          </Text>
          <Text style={styles.subtitle}>
            {isLogin ? 'Sign in to continue your health journey' : 'Create your account to get started with personalized care'}
          </Text>
        </View>

        <View style={styles.form}>
          {!isLogin && (
            <>
              {/* Name Fields */}
              <View style={styles.nameRow}>
                <View style={[styles.inputContainer, styles.halfWidth]}>
                  <TextInput
                    style={styles.input}
                    placeholder="First Name"
                    placeholderTextColor="rgba(255, 255, 255, 0.7)"
                    value={firstName}
                    onChangeText={setFirstName}
                  />
                </View>
                <View style={[styles.inputContainer, styles.halfWidth]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Last Name"
                    placeholderTextColor="rgba(255, 255, 255, 0.7)"
                    value={lastName}
                    onChangeText={setLastName}
                  />
                </View>
              </View>

              {/* Email Field */}
              <View style={styles.inputContainer}>
                <View style={styles.inputWithIcon}>
                  <Ionicons name="mail-outline" size={20} color="rgba(255, 255, 255, 0.7)" style={styles.inputIcon} />
                  <TextInput
                    style={styles.inputWithIconText}
                    placeholder="Email Address"
                    placeholderTextColor="rgba(255, 255, 255, 0.7)"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* Phone Number Field */}
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Phone Number (Optional)"
                  placeholderTextColor="rgba(255, 255, 255, 0.7)"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                />
              </View>

              {/* Password Fields */}
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="rgba(255, 255, 255, 0.7)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Confirm Password"
                  placeholderTextColor="rgba(255, 255, 255, 0.7)"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </View>

              {/* User Type Selection */}
              <View style={styles.userTypeContainer}>
                <Text style={styles.userTypeLabel}>I am:</Text>
                <View style={styles.radioGroup}>
                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => setUserType('hire')}
                  >
                    <View style={styles.radioButton}>
                      {userType === 'hire' && <View style={styles.radioSelected} />}
                    </View>
                    <Text style={styles.radioText}>A senior looking for health support</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => setUserType('offer')}
                  >
                    <View style={styles.radioButton}>
                      {userType === 'offer' && <View style={styles.radioSelected} />}
                    </View>
                    <Text style={styles.radioText}>A caregiver or family member</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}

          {isLogin && !showSeniorEmailInput && (
            <>
              <View style={styles.inputContainer}>
                <View style={styles.inputWithIcon}>
                  <Ionicons name="mail-outline" size={20} color="rgba(255, 255, 255, 0.7)" style={styles.inputIcon} />
                  <TextInput
                    style={styles.inputWithIconText}
                    placeholder="Email Address"
                    placeholderTextColor="rgba(255, 255, 255, 0.7)"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>
              
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="rgba(255, 255, 255, 0.7)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>
            </>
          )}

          {isLogin && showSeniorEmailInput && (
            <>
              <View style={styles.seniorEmailContainer}>
                <Text style={styles.seniorEmailTitle}>Connect to Senior Account</Text>
                <Text style={styles.seniorEmailSubtitle}>
                  Please enter the email address of the senior you are monitoring
                </Text>
                <View style={styles.inputContainer}>
                  <View style={styles.inputWithIcon}>
                    <Ionicons name="person-outline" size={20} color="rgba(255, 255, 255, 0.7)" style={styles.inputIcon} />
                    <TextInput
                      style={styles.inputWithIconText}
                      placeholder="Senior's Email Address"
                      placeholderTextColor="rgba(255, 255, 255, 0.7)"
                      value={seniorEmail}
                      onChangeText={setSeniorEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      editable={!isLoading}
                    />
                  </View>
                </View>
              </View>
            </>
          )}

          <TouchableOpacity 
            style={[styles.authButton, isLoading && styles.authButtonDisabled]} 
            onPress={showSeniorEmailInput ? handleSeniorEmailSubmit : handleAuth}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#667eea" size="small" />
            ) : (
              <Text style={styles.authButtonText}>
                {showSeniorEmailInput ? 'Connect' : isLogin ? 'Sign In' : 'Create Account'}
              </Text>
            )}
          </TouchableOpacity>

          {showSeniorEmailInput && (
            <TouchableOpacity
              style={styles.backToLoginButton}
              onPress={() => {
                setShowSeniorEmailInput(false);
                setSeniorEmail('');
              }}
            >
              <Text style={styles.backToLoginButtonText}>Back to Login</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => setIsLogin(!isLogin)}
          >
            <Text style={styles.switchButtonText}>
              {isLogin
                ? "Don't have an account? Sign Up"
                : 'Already have an account? Sign In'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButtonContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 1,
  },
  backButton: {
    padding: 8,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  halfWidth: {
    width: '48%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 15,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  inputIcon: {
    marginRight: 10,
  },
  inputWithIconText: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
  },
  userTypeContainer: {
    marginBottom: 30,
  },
  userTypeLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  radioGroup: {
    gap: 12,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
  radioText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  authButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  authButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  authButtonText: {
    color: '#667eea',
    fontSize: 18,
    fontWeight: '600',
  },
  switchButton: {
    alignItems: 'center',
    marginTop: 20,
  },
  switchButtonText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
  },
  seniorEmailContainer: {
    marginBottom: 20,
  },
  seniorEmailTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  seniorEmailSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 20,
    textAlign: 'center',
  },
  backToLoginButton: {
    alignItems: 'center',
    marginTop: 15,
  },
  backToLoginButtonText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});

export default AuthScreen;
