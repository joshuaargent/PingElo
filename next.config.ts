import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	reactStrictMode: true,

	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "i.ytimg.com",
				pathname: "/**",
			},
			{
				protocol: "https",
				hostname: "yt3.ggpht.com",
				pathname: "/**",
			},
			{
				protocol: "https",
				hostname: "avatars.githubusercontent.com",
				pathname: "/**",
			},
			{
				protocol: "https",
				hostname: "raw.githubusercontent.com",
				pathname: "/**",
			},
			{
				protocol: "https",
				hostname: "images.unsplash.com",
				pathname: "/**",
			},
		],
	},

	// Enable experimental features
	experimental: {
		optimizePackageImports: ["lucide-react", "framer-motion", "date-fns"],
	},

	// Headers for security and caching
	async headers() {
		return [
			{
				source: "/(.*)",
				headers: [
					// Content Security Policy
					{
						key: "Content-Security-Policy",
						value: [
							"default-src 'self'",
							"script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js requires these
							"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
							"img-src 'self' data: blob: https://i.ytimg.com https://yt3.ggpht.com https://avatars.githubusercontent.com https://raw.githubusercontent.com https://images.unsplash.com",
							"font-src 'self' https://fonts.gstatic.com",
							"connect-src 'self'",
							"frame-ancestors 'none'",
							"base-uri 'self'",
							"form-action 'self'",
						].join("; "),
					},
					{
						key: "X-Content-Type-Options",
						value: "nosniff",
					},
					{
						key: "X-Frame-Options",
						value: "DENY",
					},
					{
						key: "X-XSS-Protection",
						value: "1; mode=block",
					},
					{
						key: "Referrer-Policy",
						value: "strict-origin-when-cross-origin",
					},
					// Permissions Policy - restrict browser features
					{
						key: "Permissions-Policy",
						value: "camera=(), microphone=(), geolocation=()",
					},
				],
			},
			// HSTS for HTTPS enforcement (only for production)
			{
				source: "/(.*)",
				headers: [
					{
						key: "Strict-Transport-Security",
						value: "max-age=31536000; includeSubDomains",
					},
				],
			},
			{
				source: "/fonts/(.*)",
				headers: [
					{
						key: "Cache-Control",
						value: "public, max-age=31536000, immutable",
					},
				],
			},
		];
	},
};

export default nextConfig;
