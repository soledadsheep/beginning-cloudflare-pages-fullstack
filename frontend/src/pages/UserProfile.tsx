import React, { useEffect, useState } from 'react';
import { Card, Button, Space, Spin, message, Modal, Form, Input, DatePicker } from 'antd';
import { EditOutlined, LogoutOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getApiBaseUrl } from '../config';
import { UserInfoCard } from '../components/UserInfoCard';
import dayjs from 'dayjs';

interface UserDetails {
  id: number;
  user_name: string;
  email: string;
  full_name: string;
  first_name: string;
  last_name: string;
  avatar?: string;
  country_code?: string;
  phone?: string;
  address1?: string;
  address2?: string;
  birth_date?: string;
  last_online_time?: string;
  last_login_time?: string;
  created_at?: string;
  permissions: string[];
}

export const UserProfile: React.FC = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [form] = Form.useForm();
  const [apiBaseUrl, setApiBaseUrl] = useState('');

  useEffect(() => {
    getApiBaseUrl().then(setApiBaseUrl);
  }, []);

  useEffect(() => {
    if (apiBaseUrl && token && user) {
      loadUserProfile();
    }
  }, [apiBaseUrl, token, user]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiBaseUrl}/api/user/${user?.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setUserDetails(data.user || data);
        form.setFieldsValue({
          user_name: data.user?.user_name || data.user_name,
          email: data.user?.email || data.email,
          full_name: data.user?.full_name || data.full_name,
          first_name: data.user?.first_name || data.first_name,
          last_name: data.user?.last_name || data.last_name,
          phone: data.user?.phone || data.phone,
          country_code: data.user?.country_code || data.country_code,
          address1: data.user?.address1 || data.address1,
          address2: data.user?.address2 || data.address2,
          birth_date: data.user?.birth_date ? dayjs(data.user.birth_date) : undefined,
        });
      } else if (response.status === 404) {
        message.error('User profile not found');
      } else {
        message.error('Failed to load user profile');
      }
    } catch (error) {
      message.error('Error loading user profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Modal.confirm({
      title: 'Confirm Logout',
      icon: <ExclamationCircleOutlined />,
      content: 'Are you sure you want to log out?',
      okText: 'Yes',
      cancelText: 'No',
      onOk() {
        logout();
        navigate('/');
        message.success('Logged out successfully');
      },
    });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!userDetails) {
    return (
      <Card style={{ maxWidth: '800px', margin: '40px auto' }}>
        <h2>User Profile Not Available</h2>
        <p>Unable to load user profile. Please try again later.</p>
        <Button onClick={() => navigate('/admin')}>Back to Dashboard</Button>
      </Card>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px' }}>
      <Card 
        style={{ marginBottom: '24px' }}
        extra={
          <Space>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? 'Cancel' : 'Edit'}
            </Button>
            <Button
              danger
              icon={<LogoutOutlined />}
              onClick={handleLogout}
            >
              Logout
            </Button>
          </Space>
        }
      >
        <UserInfoCard user={userDetails} loading={loading} />
      </Card>

      {isEditing && (
        <Card title="Edit Profile" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <Form
            form={form}
            layout="vertical"
            onFinish={async (values) => {
              // You could add an API call here to update user profile
              message.info('Profile update feature coming soon');
              setIsEditing(false);
            }}
          >
            <Form.Item label="Username" name="user_name">
              <Input disabled />
            </Form.Item>
            <Form.Item label="Email" name="email">
              <Input disabled type="email" />
            </Form.Item>
            <Form.Item label="Full Name" name="full_name">
              <Input />
            </Form.Item>
            <Form.Item label="First Name" name="first_name">
              <Input />
            </Form.Item>
            <Form.Item label="Last Name" name="last_name">
              <Input />
            </Form.Item>
            <Form.Item label="Phone" name="phone">
              <Input type="tel" />
            </Form.Item>
            <Form.Item label="Country Code" name="country_code">
              <Input maxLength={2} />
            </Form.Item>
            <Form.Item label="Address Line 1" name="address1">
              <Input />
            </Form.Item>
            <Form.Item label="Address Line 2" name="address2">
              <Input />
            </Form.Item>
            <Form.Item label="Birth Date" name="birth_date">
              <DatePicker />
            </Form.Item>

            <Space>
              <Button type="primary" htmlType="submit">
                Save Changes
              </Button>
              <Button onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </Space>
          </Form>
        </Card>
      )}

      {userDetails.last_login_time && (
        <Card style={{ marginTop: '24px', backgroundColor: '#f6f8fb' }}>
          <p style={{ margin: 0, color: '#666', fontSize: '12px' }}>
            Last login: {new Date(userDetails.last_login_time).toLocaleString()}
          </p>
          {userDetails.last_online_time && (
            <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: '12px' }}>
              Last online: {new Date(userDetails.last_online_time).toLocaleString()}
            </p>
          )}
        </Card>
      )}
    </div>
  );
};
