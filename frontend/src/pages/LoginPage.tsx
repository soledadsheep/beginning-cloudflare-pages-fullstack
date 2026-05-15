import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, Alert, Divider, Space, message } from 'antd';
import { UserOutlined, LockOutlined, GoogleOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { getApiBaseUrl } from '../config';

const { Title, Text } = Typography;

interface LoginFormData {
  user_name: string;
  password: string;
}

export const LoginPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [apiBaseUrl, setApiBaseUrl] = useState('');
  const [error, setError] = useState('');
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/admin';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  useEffect(() => {
    getApiBaseUrl().then(setApiBaseUrl);
  }, []);

  const handleLogin = async (values: LoginFormData) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${apiBaseUrl}/api/user/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const result = await response.json();

      if (result.success && result.token && result.user) {
        login(result.token, result.user);
        message.success(`Welcome back, ${result.user.full_name || result.user.user_name}!`);
        navigate(from, { replace: true });
      } else {
        setError(result.message || 'Login failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = (provider: string) => {
    if (!apiBaseUrl) return;
    window.location.href = `${apiBaseUrl}/api/oauth/${provider}/authorize`;
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto' }}>
      <Card>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Title level={2}>Login</Title>
          <Text type="secondary">Sign in to your account</Text>
        </div>

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            style={{ marginBottom: '16px' }}
            closable
            onClose={() => setError('')}
          />
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={handleLogin}
          autoComplete="off"
        >
          <Form.Item
            name="user_name"
            label="Username"
            rules={[{ required: true, message: 'Please enter your username' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Enter your username"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: 'Please enter your password' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Enter your password"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
              block
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <Link to="/forgot-password">Forgot password?</Link>
        </div>

        <Divider>Or</Divider>

        <Space direction="vertical" style={{ width: '100%' }}>
          <Button
            icon={<GoogleOutlined />}
            size="large"
            block
            onClick={() => handleOAuthLogin('google')}
            style={{ backgroundColor: '#4285f4', color: 'white', border: 'none' }}
          >
            Continue with Google
          </Button>
        </Space>

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <Text type="secondary">
            Don't have an account? <Link to="/register">Sign up</Link>
          </Text>
        </div>
      </Card>
    </div>
  );
};