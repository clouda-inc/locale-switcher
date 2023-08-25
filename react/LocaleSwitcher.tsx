import React, { useEffect, useState } from 'react'
import { Spinner } from 'vtex.styleguide'
import { SupportedLanguage } from 'langs'
import { IconGlobe } from 'vtex.store-icons'
import { useCssHandles } from 'vtex.css-handles'
import { useRuntime, Culture } from 'vtex.render-runtime'

import getLabel from './modules/getLabel'
import LocaleSwitcherList from './components/LocaleSwitcherList'
import LOCALES from './graphql/locales.gql'
import getSupportedLangs from './modules/getSupportedLangs'
import { useQuery } from 'react-apollo'

const CSS_HANDLES = [
  'list',
  'button',
  'container',
  'buttonText',
  'listElement',
  'localeIdText',
  'loadingContainer',
  'relativeContainer',
] as const

interface LocalesQuery {
  languages: {
    default: string
    supported: string[]
  }
  currentBinding: {
    supportedLocales: string[]
  } | null
}

function parseToSupportedLang({ language, locale }: Culture) {
  return {
    text: getLabel(language),
    localeId: locale,
  }
}

const LocaleSwitcher: React.FC = () => {
  const { culture, emitter } = useRuntime()
  const [open, setOpen] = useState(false)
  const [shouldRenderList, setShouldRenderList] = useState(false)
  const [changingLocale, setChangingLocale] = useState(false)

  const [selectedLocale, setSelectedLocale] = useState(
    parseToSupportedLang(culture)
  )
  const handles = useCssHandles(CSS_HANDLES)

  const { data, loading, error } = useQuery<LocalesQuery>(LOCALES, {
    ssr: false,
  })

  const supportedLanguages =
    data?.currentBinding?.supportedLocales ?? data?.languages?.supported ?? []
  const supportedLangs = getSupportedLangs(supportedLanguages)

  useEffect(() => {
    if(!supportedLangs || supportedLangs.length === 0 || !culture || !culture.locale ) return
    
    const firstLocaleId = supportedLangs.find((x) => x !== undefined)?.localeId ?? ''

    if(firstLocaleId && firstLocaleId.toUpperCase() !== 'EN-US' && (culture?.locale ?? '').toUpperCase() !== firstLocaleId.toUpperCase()) {
      emitter.emit('localesChanged', supportedLangs[0].localeId)
    }

  }, [supportedLangs, culture])
  

  const handleLocaleClick = (newLang: SupportedLanguage) => {
    setSelectedLocale(newLang)
    emitter.emit('localesChanged', newLang.localeId)
    setChangingLocale(true)
    setOpen(false)
  }

  const handleClick = () => {
    setOpen(!open)

    if (!shouldRenderList) {
      setShouldRenderList(true)
    }
  }

  const containerClasses = `${handles.container} w3 flex items-center justify-end ml2 mr3 relative`
  const buttonClasses = `${handles.button} link pa0 bg-transparent bn flex items-center pointer mr3 c-on-base`
  const buttonTextClasses = `${handles.buttonText} pl2 t-action--small order-1`

  return (
    <div className={containerClasses}>
      <div className={`${handles.relativeContainer} relative`}>
        <button
          onClick={handleClick}
          className={buttonClasses}
          onBlur={() => setOpen(false)}
        >
          {!changingLocale ? (
            <>
              <IconGlobe />
              <span className={buttonTextClasses}>{selectedLocale.text}</span>
            </>
          ) : (
            <Spinner handles={handles} size={26} />
          )}
        </button>
        {shouldRenderList && (
          <LocaleSwitcherList
            open={open}
            loading={loading}
            error={error}
            supportedLangs={supportedLangs}
            onItemClick={handleLocaleClick}
            selectedLocale={selectedLocale}
          />
        )}
      </div>
    </div>
  )
}

export default LocaleSwitcher
