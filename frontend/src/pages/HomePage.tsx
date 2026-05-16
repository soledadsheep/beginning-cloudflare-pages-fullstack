import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Row, Col, Card, Button, Typography, Space } from 'antd';
import { LoginOutlined, UserAddOutlined, DashboardOutlined, GlobalOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { getApiBaseUrl } from '../config';

const { Title, Paragraph } = Typography;

export const HomePage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [apiBaseUrl, setApiBaseUrl] = useState('');

  useEffect(() => {
    getApiBaseUrl().then(setApiBaseUrl);
  }, []);

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <Title level={1}>Welcome to Cloudflare Fullstack App</Title>
        <Paragraph style={{ fontSize: '18px', color: '#666' }}>
          A modern web application built with React, Ant Design, and Cloudflare Workers
        </Paragraph>
      </div>

      {isAuthenticated && user ? (
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <Title level={2}>Welcome back, {user.full_name || user.user_name}!</Title>
          <Space direction="vertical" size="large">
            <Button type="primary" size="large" icon={<DashboardOutlined />}>
              <Link to="/admin" style={{ color: 'inherit' }}>Go to Dashboard</Link>
            </Button>
          </Space>
        </div>
      ) : (
        <div style={{ marginBottom: '48px' }}>
          <Row gutter={[24, 24]} justify="center">
            <Col xs={24} sm={12} md={8}>
              <Card
                hoverable
                style={{ height: '100%' }}
                actions={[
                  <Button type="primary" icon={<LoginOutlined />}>
                    <Link to="/login" style={{ color: 'inherit' }}>Login</Link>
                  </Button>
                ]}
              >
                <Card.Meta
                  title="Login"
                  description="Sign in to your account with username and password"
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card
                hoverable
                style={{ height: '100%' }}
                actions={[
                  <Button icon={<UserAddOutlined />}>
                    <Link to="/register" style={{ color: 'inherit' }}>Register</Link>
                  </Button>
                ]}
              >
                <Card.Meta
                  title="Register"
                  description="Create a new account to get started"
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card
                hoverable
                style={{ height: '100%' }}
                actions={[
                  <Button
                    icon={<GlobalOutlined />}
                    onClick={() => window.location.href = apiBaseUrl ? `${apiBaseUrl}/api/oauth/google/authorize` : '/api/oauth/google/authorize'}
                  >
                    Login with Google
                  </Button>
                ]}
              >
                <Card.Meta
                  title="OAuth Login"
                  description="Sign in using Google OAuth"
                />
              </Card>
            </Col>
          </Row>
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: '48px' }}>
        <Title level={3}>Features</Title>
        <Row gutter={[24, 24]} justify="center">
          <Col xs={24} sm={12} md={6}>
            <Card size="small" title="Authentication">
              Secure login with JWT tokens and OAuth support
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card size="small" title="Database">
              Cloudflare D1 database for data persistence
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card size="small" title="File Storage">
              Cloudflare R2 for file uploads and storage
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card size="small" title="Admin Panel">
              User management and permissions system
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};