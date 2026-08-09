'use client';

import React from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { UserRole } from '@/types';

interface PermissionGuardProps {
  requiredRole?: UserRole;
  allowedRoles?: UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  requiredRole,
  allowedRoles,
  children,
  fallback = null
}) => {
  const { currentUser } = useAuthStore();

  if (!currentUser) return <>{fallback}</>;

  const currentRole = currentUser.role;

  if (requiredRole && currentRole !== requiredRole) {
    if (currentRole !== 'ROLE_ADMIN') {
      return <>{fallback}</>;
    }
  }

  if (allowedRoles && !allowedRoles.includes(currentRole)) {
    if (currentRole !== 'ROLE_ADMIN') {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
};
