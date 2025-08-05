/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    }

    // Server-specific configuration
    if (isServer) {
      config.module.rules.push({
        test: /\.wasm$/,
        type: 'asset/resource',
        generator: {
          filename: '[name][ext]',
        },
      })
    } else {
      // Client-specific configuration
      config.module.rules.push({
        test: /\.wasm$/,
        type: 'asset/resource',
      })
    }

    return config
  },
}

export default nextConfig
