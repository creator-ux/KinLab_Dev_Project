import styled from 'styled-components';
import { Link } from 'react-router-dom';

export const StyledWrapper = styled(Link)`
  text-decoration: none;
  transition: all 0.3s ease;

  .card {
   width: 160px;
   height: 210px;
   background: #E5E7EB;
   border-radius: 15px;
   transition: all 0.3s ease;
   display: flex; 
   flex-direction: column;
   align-items: center;
   position: relative;
   overflow: hidden;
   z-index: 1111;
   box-shadow: 10px 10px 30px #bebebe, -10px -10px 30px #ffffff;
  }

  .card:hover {
    transform: translateY(-4px);
    box-shadow: 10px 10px 80px #8a8a8fff, -10px -10px 80px #ffffff;
  }

  .card .card-border-top {
   width: 60%;
   height: 4%;
   background: #6b64f3;
   margin: 0 auto;
   border-radius: 0px 0px 15px 15px;
   position: relative;
   z-index: 1111;
  }

  .card span {
   font-weight: 600;
   color: #374151;
   text-align: center;
   display: block;
   padding-top: 10px;
   font-size: 20px;
   position: relative;
   z-index: 1111;
  }

  .card .job {
   font-weight: 400;
   color: #374151;
   display: block;
   text-align: center;
   padding-top: 2px;
   font-size: 14px;
   position: relative;
   z-index: 1111;
  }

  .card .img {
   width: 70px;
   height: 48px;
   background: #6b64f3;
   border-radius: 15px;
   margin: 25px auto 0;
   display: flex;
   justify-content: center;
   aling-items: center;
   position: relative;
   z-index: 1111;
  }

  .card .img .icon {
   color: #E5E7EB;
  }

  .card .button {
   padding: 4px 25px;
   display: block;
   margin-top: auto;
   margin-bottom: 20px;
   border-radius: 8px;
   border: none;
   background: #6b64f3;
   color: white;
   font-weight: 600;
   text-align: center;
   width: 60%;
   cursor: pointer;
   transition: background 0.2s ease;
   position: relative;
   z-index: 1111;
  }

  .card .button:hover {
   background: #534bf3;
  }

  .card .bg {
   position: absolute;
   top: 5px;
   left: 5px;
   width: 150px;
   height: 200px;
   z-index: 2;
   background: rgba(248, 237, 237, 0.95);
   backdrop-filter: blur(24px);
   border-radius: 10px;
   overflow: hidden;
 }

 .modul {
  c
 }

  .blob {
   position: absolute;
   z-index: 1;
   top: 50%;
   left: 50%;
   width: 150px;
   height: 150px;
   border-radius: 50%;
   opacity: 2;
   filter: blur(12px);
   animation: blob-bounce 5s infinite ease;
  }

  .blob-1 {
   background-color: #1731dcff;
   animation-delay: 0s;
  }

.blob-2 {
  background-color: #e70ca2ff;
  animation-delay: -2.5s;
}

@keyframes blob-bounce {
  0% {
    transform: translate(-100%, -100%) translate3d(0, 0, 0);
  }

  25% {
    transform: translate(-100%, -100%) translate3d(100%, 0, 0);
  }

  50% {
    transform: translate(-100%, -100%) translate3d(100%, 100%, 0);
  }

  75% {
    transform: translate(-100%, -100%) translate3d(0, 100%, 0);
  }

  100% {
    transform: translate(-100%, -100%) translate3d(0, 0, 0);
  }
}
  `;

