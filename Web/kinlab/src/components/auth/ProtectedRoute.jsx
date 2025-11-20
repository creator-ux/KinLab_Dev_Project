import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import PropTypes from 'prop-types';

function ProtectedRoute ({ children }) {
    const { user } = useAuth();

    if (!user) {
        return <Navigate to='/' replace/>;
    }

    return children;
}

ProtectedRoute.propTypes = {
    children: PropTypes.node.isRequired,
};

export default ProtectedRoute;