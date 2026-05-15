import React from 'react';
import { Card, Avatar, Row, Col, Statistic, Space, Button, Tag, Empty } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, EnvironmentOutlined } from '@ant-design/icons';

export interface UserInfoCardProps {
  user?: {
    id?: number;
    user_name?: string;
    full_name?: string;
    email?: string;
    avatar?: string;
    phone?: string;
    country_code?: string;
    permissions?: string[];
  };
  loading?: boolean;
  onAction?: () => void;
  actionLabel?: string;
}

export const UserInfoCard: React.FC<UserInfoCardProps> = ({
  user,
  loading = false,
  onAction,
  actionLabel = 'Edit',
}) => {
  if (!user) {
    return <Empty description="No user information available" />;
  }

  return (
    <Card
      loading={loading}
      style={{
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}
      extra={
        onAction && (
          <Button type="primary" onClick={onAction}>
            {actionLabel}
          </Button>
        )
      }
    >
      <Row gutter={24}>
        <Col xs={24} sm={8} style={{ textAlign: 'center' }}>
          <Avatar
            size={100}
            src={user.avatar}
            icon={<UserOutlined />}
            style={{ backgroundColor: '#1890ff' }}
          />
          <div style={{ marginTop: '16px' }}>
            <h3 style={{ marginBottom: '4px' }}>
              {user.full_name || user.user_name || 'User'}
            </h3>
            <p style={{ margin: 0, color: '#8c8c8c', fontSize: '12px' }}>
              @{user.user_name}
            </p>
          </div>
        </Col>

        <Col xs={24} sm={16}>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            {user.email && (
              <Space>
                <MailOutlined style={{ color: '#1890ff', fontSize: '16px' }} />
                <a href={`mailto:${user.email}`}>{user.email}</a>
              </Space>
            )}

            {user.phone && (
              <Space>
                <PhoneOutlined style={{ color: '#1890ff', fontSize: '16px' }} />
                <a href={`tel:${user.phone}`}>{user.phone}</a>
              </Space>
            )}

            {user.country_code && (
              <Space>
                <EnvironmentOutlined style={{ color: '#1890ff', fontSize: '16px' }} />
                <span>{user.country_code.toUpperCase()}</span>
              </Space>
            )}

            {user.permissions && user.permissions.length > 0 && (
              <div>
                <div style={{ marginBottom: '8px', fontSize: '12px', fontWeight: 500, color: '#666' }}>
                  Permissions:
                </div>
                <Space wrap>
                  {user.permissions.map((permission) => (
                    <Tag key={permission} color="blue">
                      {permission}
                    </Tag>
                  ))}
                </Space>
              </div>
            )}
          </Space>
        </Col>
      </Row>
    </Card>
  );
};
