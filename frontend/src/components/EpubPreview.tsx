import React, { useState } from 'react'
import { ReactReader } from 'react-reader'

interface EpubPreviewProps {
  epubData: ArrayBuffer
}

const EpubPreview: React.FC<EpubPreviewProps> = ({ epubData }) => {
  const [location, setLocation] = useState<string | number>(0)
  const [page, setPage] = useState('')

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'white',
      borderRadius: '12px',
      overflow: 'hidden',
      border: '1px solid #e2e8f0',
      boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
    }}>
      {/* Reader */}
      <div style={{ flex: 1, position: 'relative' }}>
        <ReactReader
          url={epubData}
          location={location}
          locationChanged={(epubcfi: string) => setLocation(epubcfi)}
          showToc={false}
          epubOptions={{
            spread: 'none',
          }}
          getRendition={(rendition) => {
            rendition.themes.register('custom', {
              'body': {
                'font-family': 'Georgia, "Times New Roman", serif !important',
                'font-size': '15px !important',
                'line-height': '1.65 !important',
                'color': '#1a1a1a !important',
                'padding': '20px 40px !important',
              },
              'p': {
                'font-size': '15px !important',
                'line-height': '1.65 !important',
              },
              'h1': { 'font-size': '24px !important' },
              'h2': { 'font-size': '20px !important' },
              'h3': { 'font-size': '17px !important' },
              'img': {
                'max-width': '100% !important',
                'height': 'auto !important',
                'display': 'block !important',
                'margin': '0.8em auto !important',
              },
              'table': {
                'width': '100% !important',
                'font-size': '13px !important',
              },
            })
            rendition.themes.select('custom')
            rendition.spread('none')

            rendition.on('relocated', (loc: any) => {
              const current = loc?.start?.displayed?.page ?? ''
              const total = loc?.start?.displayed?.total ?? ''
              if (current && total) setPage(`Página ${current} de ${total}`)
            })
          }}
        />
      </div>
      {/* Footer */}
      <div style={{
        height: 44,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
        borderTop: '1px solid #e2e8f0',
        fontSize: 13,
        color: '#64748b',
        fontWeight: 500,
      }}>
        {page || 'Usa las flechas ‹ › para navegar'}
      </div>
    </div>
  )
}

export default EpubPreview
