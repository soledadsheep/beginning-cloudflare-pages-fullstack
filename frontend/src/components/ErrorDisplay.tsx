import React from 'react';
import { Alert, Card, Button, Space } from 'antd';
import { ReloadOutlined, HomeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

interface ErrorDisplayProps {
  title?: string;
  message?: string;
  details?: string;
  errorCode?: number | string;
  showBackButton?: boolean;
  showHomeButton?: boolean;
  onRetry?: () => void;
  type?: 'error' | 'warning' | 'info' | 'success';
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  title = 'Error',
  message = 'An unexpected error occurred',
  details,
  errorCode,
  showBackButton = true,
  showHomeButton = true,
  onRetry,
  type = 'error',
}) => {
  const navigate = useNavigate();

  return (
    <Card style={{ 
      maxWidth: '600px', 
      margin: '40px auto',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <Alert
        type={type}
        message={title}
        description={message}
        showIcon
        style={{ marginBottom: '16px' }}
      />

      {errorCode && (
        <div style={{ 
          backgroundColor: '#f5f5f5', 
          padding: '12px', 
          borderRadius: '4px',
          marginBottom: '16px',
          fontFamily: 'monospace',
          fontSize: '12px'
        }}>
          <div style={{ color: '#666' }}>Error Code: {errorCode}</div>
        </div>
      )}

      {details && (
        <Card 
          size="small" 
          style={{ 
            backgroundColor: '#fafafa',
            marginBottom: '16px'
          }}
        >
          <div style={{ fontSize: '12px', color: '#666', whiteSpace: 'pre-wrap' }}>
            {details}
          </div>
        </Card>
      )}

      <Space>
        {onRetry && (
          <Button 
            icon={<ReloadOutlined />}
            onClick={onRetry}
          >
            Try Again
          </Button>
        )}
        {showBackButton && (
          <Button 
            onClick={() => navigate(-1)}
          >
            Go Back
          </Button>
        )}
        {showHomeButton && (
          <Button 
            icon={<HomeOutlined />}
            onClick={() => navigate('/')}
          >
            Go Home
          </Button>
        )}
      </Space>
    </Card>
  );
};
