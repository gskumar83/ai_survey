import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import fs from 'fs'

function copyStaticFilesPlugin(): Plugin {
  return {
    name: 'copy-static-files-plugin',
    closeBundle() {
      const distDir = path.resolve(process.cwd(), 'dist')
      if (!fs.existsSync(distDir)) return

      const copies = [
        { src: 'public/employee/js', dest: 'dist/employee/js' },
        { src: 'public/employee/css', dest: 'dist/employee/css' },
        { src: 'public/admin/js', dest: 'dist/admin/js' },
        { src: 'public/assets', dest: 'dist/assets' },
      ]

      for (const item of copies) {
        const from = path.resolve(process.cwd(), item.src)
        const to = path.resolve(process.cwd(), item.dest)

        if (fs.existsSync(from)) {
          fs.mkdirSync(to, { recursive: true })
          fs.cpSync(from, to, { recursive: true })
        }
      }
    },
  }
}

function htmlRewritePlugin(): Plugin {
  return {
    name: 'html-rewrite-plugin',

    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const rawUrl = req.url || ''
        const [pathname, search] = rawUrl.split('?')
        const query = search ? `?${search}` : ''

        // 1. Directory redirects
        if (pathname === '/employee') {
          res.writeHead(302, {
            Location: `/employee/${query}`,
          })
          res.end()
          return
        }

        if (pathname === '/admin' || pathname === '/src/pages/admin') {
          res.writeHead(302, {
            Location: `/admin/${query}`,
          })
          res.end()
          return
        }


        // 2. Direct root HTML redirects
        if (pathname === '/welcome.html' || pathname === '/welcome') {
          res.writeHead(302, {
            Location: `/employee/welcome.html${query}`,
          })
          res.end()
          return
        }

        if (
          pathname === '/survey.html' ||
          pathname === '/survey' ||
          pathname === '/instructions.html' ||
          pathname === '/instructions'
        ) {
          res.writeHead(302, {
            Location: `/employee/survey.html${query}`,
          })
          res.end()
          return
        }

        if (pathname === '/feedback.html' || pathname === '/feedback') {
          res.writeHead(302, {
            Location: `/employee/feedback.html${query}`,
          })
          res.end()
          return
        }

        if (
          pathname === '/confrimation.html' ||
          pathname === '/confirmation.html' ||
          pathname === '/confirmation' ||
          pathname === '/confrimation'
        ) {
          res.writeHead(302, {
            Location: `/employee/confirmation.html${query}`,
          })
          res.end()
          return
        }

        if (pathname === '/visteria-admin-panel.html') {
          res.writeHead(302, {
            Location: `/admin/visteria-admin-panel.html${query}`,
          })
          res.end()
          return
        }

        // 3. Static assets are naturally served from public/

        // 4. Employee routing
        if (
          pathname === '/employee' ||
          pathname === '/employee/' ||
          pathname === '/employee/auth.html' ||
          pathname === '/employee/login' ||
          pathname === '/employee/register' ||
          pathname === '/employee/reset-password' ||
          pathname === '/employee/forgot-password' ||
          pathname === '/reset-password' ||
          pathname === '/forgot-password'
        ) {
          req.url = `/employee/index.html${query}`
          next()
          return
        }

        if (
          pathname === '/employee/welcome' ||
          pathname === '/employee/welcome/'
        ) {
          req.url = `/employee/welcome.html${query}`
          next()
          return
        }

        if (
          pathname === '/employee/instructions' ||
          pathname === '/employee/instructions/' ||
          pathname === '/employee/instructions.html'
        ) {
          res.writeHead(302, {
            Location: `/employee/survey.html${query}`,
          })
          res.end()
          return
        }

        if (
          pathname === '/employee/survey' ||
          pathname === '/employee/survey/'
        ) {
          req.url = `/employee/survey.html${query}`
          next()
          return
        }

        if (
          pathname === '/employee/feedback' ||
          pathname === '/employee/feedback/'
        ) {
          req.url = `/employee/feedback.html${query}`
          next()
          return
        }

        if (
          pathname === '/employee/confirmation' ||
          pathname === '/employee/confirmation/' ||
          pathname === '/employee/confirmation.html' ||
          pathname === '/employee/confrimation' ||
          pathname === '/employee/confrimation/'
        ) {
          req.url = `/employee/confirmation.html${query}`
          next()
          return
        }

        // 5. Admin routing
        const isAdminPath =
          pathname.startsWith('/admin/') ||
          pathname.startsWith('/src/pages/admin/')

        const isStaticAsset =
          /\.(js|css|png|jpg|jpeg|gif|svg|ico|json|woff|woff2|ttf|map)$/i.test(
            pathname
          )

        if (
          pathname === '/admin' ||
          pathname === '/admin/' ||
          pathname === '/admin/login' ||
          pathname === '/admin/login.html' ||
          pathname === '/src/pages/admin/login.html' ||
          pathname === '/src/pages/admin/login' ||
          pathname === '/src/pages/admin/index.html' ||
          pathname === '/src/pages/admin/visteria-admin-panel.html' ||
          (isAdminPath &&
            !isStaticAsset &&
            !pathname.endsWith('.html'))
        ) {
          req.url = `/admin/visteria-admin-panel.html${query}`
          next()
          return
        }

        next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    htmlRewritePlugin(),
    copyStaticFilesPlugin(),
  ],

  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: false,
    proxy: {
      // Proxy all /api requests to the Express backend
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        timeout: 10000,
        proxyTimeout: 10000,
      },
      // Proxy uploaded company logos and assets
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },

  build: {
    rollupOptions: {
      input: {
        main: path.resolve(process.cwd(), 'index.html'),

        employee: path.resolve(
          process.cwd(),
          'public/employee/index.html'
        ),

        welcome: path.resolve(
          process.cwd(),
          'public/employee/welcome.html'
        ),

        survey: path.resolve(
          process.cwd(),
          'public/employee/survey.html'
        ),

        feedback: path.resolve(
          process.cwd(),
          'public/employee/feedback.html'
        ),

        confirmation: path.resolve(
          process.cwd(),
          'public/employee/confirmation.html'
        ),

        admin: path.resolve(
          process.cwd(),
          'public/admin/visteria-admin-panel.html'
        ),
      },
    },
  },
})