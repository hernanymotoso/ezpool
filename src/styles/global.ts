import { createGlobalStyle } from 'styled-components'
import skeleton from './skeleton'

export const GlobalStyle = createGlobalStyle`
  ${skeleton}

  :root {
    --background: #E9ECEF;
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html {
    @media (max-width: 1080px) {
      font-size: 93.75%; // 15px
    }

    @media (max-width: 720px) {
      font-size: 87.5%;// 14px
    }

    &::-webkit-scrollbar {
      width: 5px;
    }

    &::-webkit-scrollbar-track {
      width: 5px;
      background: #eaebf0;
      border-radius: 24px;
    }

    &::-webkit-scrollbar-thumb {
      background: #ced4da;
      border-radius: 24px;
    }
  }

  body {
    background: var(--background);
    -webkit-font-smoothing: antialiased;
  }

  body, input, textarea, button {
    font-family: 'Open Sans', sans-serif;
    font-weight: 400
  }

  h1, h2, h3, h4, h5, h6, strong {
    font-weight: 700;
  }

  button {
    cursor: pointer;
  }

  [disabled] {
    opacity: 0.6;
    cursor: not-allowed;
  }

  nextjs-portal {
    display: none;
  }
`
