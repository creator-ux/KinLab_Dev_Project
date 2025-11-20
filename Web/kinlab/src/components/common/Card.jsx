import React from 'react';
import PropTypes from 'prop-types';
import { StyledWrapper } from './CardStyle';

function Card ({ to, title, description, icon: IconComponent }){
    return(
        <StyledWrapper to={to}>
            <div className="card">
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
                <div className="bg"></div>
                <div className="card-border-top"></div>
                <div className="img">
                    {IconComponent && <IconComponent size={48} className="icon" />}
                </div>

                <span>{title}</span>
                <p className="job">{description}</p>

                <div className="button">
                    Ir
                </div>
            </div>
        </StyledWrapper>
    );
}

Card.propTypes = {
    to: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    icon: PropTypes.elementType.isRequired,
};

export default Card;
