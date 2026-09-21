import type { ButtonHTMLAttributes, HTMLAttributes } from 'react';
import './Card.css';

type DivProps = HTMLAttributes<HTMLDivElement>;
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function Card({ className = '', ...props }: DivProps) {
  return <div className={`card ${className}`.trim()} {...props} />;
}

export function CardButton({ className = '', ...props }: ButtonProps) {
  return <button type="button" className={`card ${className}`.trim()} {...props} />;
}
