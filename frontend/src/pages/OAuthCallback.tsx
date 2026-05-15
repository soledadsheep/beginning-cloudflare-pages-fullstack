import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Spin, Result, Card, Button, Space, Empty, Progress } from 'antd';
import { useAuth } from '../contexts/AuthContext';
import { getApiBaseUrl, decodeJWT } from '../config';
import { ErrorDisplay } from '../components/ErrorDisplay';
import { UserInfoCard } from '../components/UserInfoCard';

interface UserInfo {
  id: number;
  user_name: string;
  email: string;
  full_name: string;
  avatar?: string;
  permissions: string[];
}

export const OAuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [errorDetails, setErrorDetails] = useState('');
  const [errorCode, setErrorCode] = useState<string | number>('');
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [redirectCountdown, setRedirectCountdown] = useState(3);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const token = searchParams.get('token');
      const error = searchParams.get('error');
      const errorDesc = searchParams.get('error_description');

      if (error) {
        setStatus('error');
        setErrorCode(error);
        setErrorMessage(`OAuth Provider Error`);
        setErrorDetails(errorDesc || 'Failed to authenticate with external provider. Please verify your OAuth credentials and try again.');
        return;
      }

      if (!token) {
        setStatus('error');
        setErrorCode('NO_TOKEN');
        setErrorMessage('Authentication Token Not Received');
        setErrorDetails(
          'The backend server did not return an authentication token. This might indicate:\n' +
          '• The OAuth provider validation failed\n' +
          '• The user data could not be retrieved\n' +
          '• A backend configuration issue\n\n' +
          'Please check the browser console and backend logs for more details.'
        );
        return;
      }

      try {
        // Decode and validate the JWT token to get user info
        const payload = decodeJWT(token);
        if (!payload) {
          throw new Error('Invalid token format');
        }

        const user: UserInfo = {
          id: payload.sub,
          user_name: payload.user_name,
          email: payload.email,
          full_name: payload.user_name,
          permissions: payload.permissions || [],
        };

        setUserInfo(user);
        login(token, user);
        setStatus('success');

      } catch (error: any) {
        setStatus('error');
        setErrorCode('TOKEN_VALIDATION_ERROR');
        setErrorMessage('Failed to Process Authentication Token');
        setErrorDetails(
          `Token validation failed: ${error?.message || 'Unknown error'}\n\n` +
          'This might indicate that the token format is invalid or corrupted. ' +
          'Try logging in again.'
        );
      }
    };

    handleOAuthCallback();
  }, [searchParams, login, navigate]);

  // Countdown timer for redirect
  useEffect(() => {
    if (status === 'success') {
      const timer = setInterval(() => {
        setRedirectCountdown((prev) => {
          if (prev <= 1) {
            navigate('/admin', { replace: true });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [status, navigate]);

  if (status === 'loading') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', width: '100%', maxWidth: '400px' }}>
          <div style={{ marginBottom: '32px' }}>
            <Spin size="large" />
          </div>
          <h2 style={{ marginBottom: '8px' }}>Completing Authentication</h2>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '32px' }}>
            Verifying your credentials with the OAuth provider...
          </p>
          <Progress percent={50} showInfo={false} status="active" />
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <ErrorDisplay
        title="OAuth Authentication Failed"
        message={errorMessage}
        details={errorDetails}
        errorCode={errorCode}
        onRetry={() => navigate('/login')}
        actionLabel="Return to Login"
      />
    );
  }

  if (status === 'success' && userInfo) {
    return (
      <div style={{ maxWidth: '800px', margin: '40px auto', padding: '24px' }}>
        <Result
          status="success"
          title="Authentication Successful!"
          subTitle="Welcome! Your credentials have been verified."
        />

        <Card style={{ marginTop: '24px', marginBottom: '24px' }}>
          <UserInfoCard user={userInfo} />
        </Card>

        <Card style={{ backgroundColor: '#f6f8fb', textAlign: 'center' }}>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
              {redirectCountdown}
            </div>
            <p style={{ fontSize: '14px', color: '#666' }}>
              Redirecting to dashboard...
            </p>
          </div>
          <Space>
            <Button type="primary" onClick={() => navigate('/admin')}>
              Go to Dashboard Now
            </Button>
            <Button onClick={() => navigate('/profile')}>
              View Profile
            </Button>
          </Space>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '700px', margin: '40px auto', padding: '24px' }}>
      <Empty description="Invalid authentication state" />
    </div>
  );
};