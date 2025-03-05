 if (typeof navigator !== 'undefined') {
      let languages = navigator.languages
      if (!navigator.languages) languages = [navigator.language]

      for (let language of languages) {
        if (opts.available.includes(language)) {
          store.set(language)
          return
        }
      }
    }
