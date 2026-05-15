import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Button, Table, Avatar, Tag, Space, message, Modal } from 'antd';
import {
  UserOutlined,
  FileOutlined,
  DatabaseOutlined,
  LogoutOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getApiBaseUrl } from '../config';

const { confirm } = Modal;

interface User {
  id: number;
  user_name: string;
  full_name: string;
  email: string;
  avatar?: string;
  last_online_time?: string;
  created_at?: string;
}

interface DashboardStats {
  totalUsers: number;
  totalFiles: number;
  totalConnections: number;
}

export const AdminDashboard: React.FC = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [apiBaseUrl, setApiBaseUrl] = useState('');
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalFiles: 0,
    totalConnections: 0,
  });
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getApiBaseUrl().then(setApiBaseUrl);
  }, []);

  useEffect(() => {
    if (apiBaseUrl && token) {
      loadDashboardData();
    }
  }, [apiBaseUrl, token]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load users
      const usersResponse = await fetch(`${apiBaseUrl}/api/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData.users || []);
        setStats(prev => ({ ...prev, totalUsers: usersData.total || 0 }));
      }

      // Load OAuth connections
      const connectionsResponse = await fetch(`${apiBaseUrl}/api/oauth/connection`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (connectionsResponse.ok) {
        const connectionsData = await connectionsResponse.json();
        setStats(prev => ({ ...prev, totalConnections: connectionsData.total || 0 }));
      }

      // You could add file stats here if you have a files API

    } catch (error) {
      message.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    confirm({
      title: 'Confirm Logout',
      icon: <ExclamationCircleOutlined />,
      content: 'Are you sure you want to log out?',
      onOk() {
        logout();
        navigate('/');
        message.success('Logged out successfully');
      },
    });
  };

  const userColumns = [
    {
      title: 'Avatar',
      dataIndex: 'avatar',
      key: 'avatar',
      render: (avatar: string) => (
        <Avatar src={avatar} icon={<UserOutlined />} />
      ),
    },
    {
      title: 'Username',
      dataIndex: 'user_name',
      key: 'user_name',
    },
    {
      title: 'Full Name',
      dataIndex: 'full_name',
      key: 'full_name',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Last Online',
      dataIndex: 'last_online_time',
      key: 'last_online_time',
      render: (time: string) => time ? new Date(time).toLocaleString() : 'Never',
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Admin Dashboard</h1>
          <p>Welcome back, {user?.full_name || user?.user_name}!</p>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadDashboardData} loading={loading}>
            Refresh
          </Button>
          <Button danger icon={<LogoutOutlined />} onClick={handleLogout}>
            Logout
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Users"
              value={stats.totalUsers}
              prefix={<UserOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="OAuth Connections"
              value={stats.totalConnections}
              prefix={<DatabaseOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Files"
              value={stats.totalFiles}
              prefix={<FileOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>

      <Card title="User Permissions" style={{ marginBottom: '24px' }}>
        <Space wrap>
          {user?.permissions?.map((permission) => (
            <Tag key={permission} color="blue">
              {permission}
            </Tag>
          )) || <Tag>No permissions assigned</Tag>}
        </Space>
      </Card>

      <Card title="Recent Users">
        <Table
          columns={userColumns}
          dataSource={users.slice(0, 10)} // Show only first 10 users
          rowKey="id"
          loading={loading}
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  );
};