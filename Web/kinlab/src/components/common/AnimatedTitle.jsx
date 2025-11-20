import React, { useState, useEffect } from "react";
import styled, { keyframes } from 'styled-components';
import { Link } from 'react-router-dom';
import PropTypes from "prop-types";

const blink = keyframes`
  50% { border-color: transparent; }
`;

export const StyledTitle = styled(Link)`
  display: inline-block;
  color: #1f2937;
  font-weight: bold;
  font-size: 2rem;  
  white-space: nowrap;
  overflow: hidden;
  border-right: 3px solid #4b5563;
  animation: , 
    ${blink} 0.6s step-end infinite alternate;
  text-decoration: none;
  margin-bottom: 2rem;

  &:hover {
    color: #6B64F3;
    border-color: #2D45DE;
  }
`;

export function AnimatedTitle({ texts = ["PANEL DE ADMINISTRADOR", "MODULOS DEL LABORATORIO", "LABORATORIOS"], speed = 100 }) {
  const [index, setIndex] = useState(0);       // texto actual
  const [subIndex, setSubIndex] = useState(0); // cantidad de letras mostradas
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = texts[index];

    if (subIndex === current.length + 1 && !deleting) {
      setTimeout(() => setDeleting(true), 1000); // espera antes de borrar
      return;
    }

    if (deleting && subIndex === 0) {
      setDeleting(false);
      setIndex((prev) => (prev + 1) % texts.length); // pasa al siguiente texto
      return;
    }

    const timeout = setTimeout(() => {
      setSubIndex((prev) => prev + (deleting ? -1 : 1));
    }, deleting ? speed / 2 : speed);

    return () => clearTimeout(timeout);
  }, [subIndex, deleting, index, texts, speed]);

  return (
    <StyledTitle to="#">
      {texts[index].substring(0, subIndex)}
    </StyledTitle>
  );
}
AnimatedTitle.propTypes = {
    speed: PropTypes.number.isRequired,
    texts: PropTypes.arrayOf(PropTypes.string),
};