(function () {
    'use strict';
    var __scriptEl = document.currentScript;
    var __scriptSrc = (__scriptEl && __scriptEl.src) ? (__scriptEl.src + '') : '';
    var __baseSrc = __scriptSrc.split('?')[0];
    var __pluginName = "Anime Hub + Lordfilm 4K (2-в-1)";
    var __pluginDescr = "Аниме (Kodik / AniLibria / Alloha) + Фильмы и сериалы 4K (автокеш в памяти Lampa)";
    var __rawCode = "(function () {\n'use strict';\nif (window.plugin_anime_hub_ready) return;\nwindow.plugin_anime_hub_ready = true;\nvar KODIK_API = 'https://kodik-api.com/search';\nvar KODIK_TOKEN = '41dd95f84c21719b09d6c71182237a25';\nvar ANILIBRIA_API = 'https://api.anilibria.app/api/v1';\nvar ALLOHA_API = 'https://api.apbugall.org/';\nvar ALLOHA_TOKEN = 'ec4acf58bc9bf62f8be18cad95484c';\nvar PRIORITY_TEAMS = [\n'crunchyroll', 'anilibria', 'aniliberty', 'anidub', 'animedia',\n'studio band', 'студийная банда', 'shiza', 'dream cast', 'jam',\n'animevost', 'anistar', 'onwave', 'ancord', 'subtitles', 'субтитры'\n];\nfunction getTeamPriority(name, type) {\nvar low = (name || '').toLowerCase();\nfor (var i = 0; i < PRIORITY_TEAMS.length; i++) {\nif (low.indexOf(PRIORITY_TEAMS[i]) !== -1) return i;\n}\nif (type === 'subtitles') return PRIORITY_TEAMS.length;\nreturn 999;\n}\nfunction fixProto(url) {\nif (!url) return '';\nif (url.indexOf('//') === 0) return 'https:' + url;\nreturn url;\n}\nfunction openIframePlayer(iframeUrl, title, onClose) {\n$('meta[name=\"referrer\"]').attr('content', 'origin');\n$('.anime-hub-iframe-modal').remove();\nvar fullUrl = fixProto(iframeUrl);\nvar modal = $('<div class=\"anime-hub-iframe-modal\" style=\"position:fixed;top:0;left:0;width:100%;height:100%;z-index:99999;background:#000;display:flex;flex-direction:column;\">' +\n'<div class=\"anime-hub-iframe-header\" style=\"height:3.2em;background:rgba(15,15,15,0.95);display:flex;align-items:center;justify-content:space-between;padding:0 1.5em;color:#fff;border-bottom:1px solid rgba(255,255,255,0.12);flex-shrink:0;\">' +\n'<div style=\"font-size:1.15em;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;\">' + (title || 'Anime Hub') + '</div>' +\n'<div class=\"anime-hub-iframe-close selector\" style=\"padding:0.45em 1em;background:rgba(255,255,255,0.14);border-radius:0.4em;cursor:pointer;font-size:0.95em;font-weight:500;\">Закрыть (Esc / Назад)</div>' +\n'</div>' +\n'<div style=\"flex:1;position:relative;width:100%;height:100%;\">' +\n'<iframe sandbox=\"allow-scripts allow-same-origin\" referrerpolicy=\"origin\" src=\"' + fullUrl + '\" style=\"position:absolute;top:0;left:0;width:100%;height:100%;border:0;\" allow=\"autoplay; fullscreen; encrypted-media; picture-in-picture\" allowfullscreen></iframe>' +\n'</div>' +\n'</div>');\nfunction closeModal() {\n$(window).off('keydown.anime_hub_modal');\nmodal.remove();\nif (onClose) onClose();\n}\nmodal.find('.anime-hub-iframe-close').on('click hover:enter', function () {\ncloseModal();\n});\n$(window).on('keydown.anime_hub_modal', function (e) {\nif (e.keyCode === 27 || e.keyCode === 8 || e.keyCode === 461 || e.keyCode === 10009) {\ne.preventDefault();\ne.stopPropagation();\ncloseModal();\n}\n});\n$('body').append(modal);\nLampa.Controller.add('anime_hub_iframe', {\ntoggle: function () {\nLampa.Controller.collectionSet(modal);\nLampa.Controller.collectionFocus(modal.find('.anime-hub-iframe-close')[0], modal);\n},\nback: function () {\ncloseModal();\n}\n});\nLampa.Controller.toggle('anime_hub_iframe');\n}\nfunction AnimeHubComponent(object) {\nvar network = new Lampa.Reguest();\nvar scroll = new Lampa.Scroll({ mask: true, over: true });\nvar files = new Lampa.Explorer(object);\nvar filter = new Lampa.Filter(object);\nvar sources = [\n{ id: 'kodik', name: 'Kodik (AniDUB / AniLibria / Animedia / Crunchyroll / Субтитры)' },\n{ id: 'anilibria', name: 'AniLibria Direct (Прямой поток 1080p без рекламы)' },\n{ id: 'alloha', name: 'Alloha Anime (4K UHD / 1080p + Озвучки и Субтитры)' }\n];\nvar choice = {\nsource: 0,\nseason: 0,\nvoice: 0\n};\nvar kodikGroups = [];\nvar kodikVoices = [];\nvar libriaReleases = [];\nvar libriaCurrent = null;\nvar allohaData = null;\nvar allohaIsSerial = false;\nvar allohaSeasons = [];\nvar allohaVoices = [];\nthis.create = function () {\nvar _this = this;\nthis.activity.loader(true);\nthis.closeFilter = function () {\nif ($('body').hasClass('selectbox--open')) Lampa.Select.close();\n};\nfilter.onSearch = function (value) {\nLampa.Activity.replace({\nsearch: value,\nclarification: true\n});\n};\nfilter.onSelect = function (type, a, b) {\nif (type === 'filter') {\nif (a.stype === 'source' && b) {\nchoice.source = b.index;\nchoice.season = 0;\nchoice.voice = 0;\nsetTimeout(_this.closeFilter, 10);\n_this.loadSource();\n} else if (a.stype === 'season' && b) {\nchoice.season = b.index;\nchoice.voice = 0;\nsetTimeout(_this.closeFilter, 10);\nvar srcId = sources[choice.source].id;\nif (srcId === 'kodik') {\n_this.buildKodikVoices();\n_this.renderKodik();\n} else if (srcId === 'anilibria') {\n_this.loadLibriaRelease(libriaReleases[choice.season].id);\n} else if (srcId === 'alloha') {\n_this.buildAllohaVoices();\n_this.renderAlloha();\n}\n} else if (a.stype === 'voice' && b) {\nchoice.voice = b.index;\nsetTimeout(_this.closeFilter, 10);\nvar srcId2 = sources[choice.source].id;\nif (srcId2 === 'kodik') _this.renderKodik();\nelse if (srcId2 === 'alloha') _this.renderAlloha();\n}\n} else if (type === 'sort' && a) {\nchoice.source = a.index || 0;\nchoice.season = 0;\nchoice.voice = 0;\nsetTimeout(_this.closeFilter, 10);\n_this.loadSource();\n}\n};\nfilter.onBack = function () {\n_this.start();\n};\nscroll.body().addClass('torrent-list');\nfiles.appendFiles(scroll.render());\nfiles.appendHead(filter.render());\nscroll.minus(files.render().find('.explorer__files-head'));\nthis.loadSource();\nreturn this.render();\n};\nthis.loadSource = function () {\nvar srcId = sources[choice.source].id;\nthis.activity.loader(true);\nscroll.clear();\nif (srcId === 'kodik') this.searchKodik();\nelse if (srcId === 'anilibria') this.searchLibria();\nelse if (srcId === 'alloha') this.searchAlloha();\n};\n/* ==================== 1. KODIK ==================== */\nthis.searchKodik = function () {\nvar _this = this;\nvar movie = object.movie || {};\nvar queries = [];\nif (movie.kinopoisk_id) queries.push('kinopoisk_id=' + encodeURIComponent(movie.kinopoisk_id));\nif (movie.imdb_id) queries.push('imdb_id=' + encodeURIComponent(movie.imdb_id));\nvar ruTitle = object.search || movie.title || movie.name || '';\nvar origTitle = movie.original_title || movie.original_name || '';\nif (ruTitle) queries.push('title=' + encodeURIComponent(ruTitle));\nif (origTitle && origTitle !== ruTitle) queries.push('title_orig=' + encodeURIComponent(origTitle));\nif (!queries.length) {\nthis.empty('Нет данных для поиска аниме');\nreturn;\n}\nfunction tryNext(idx) {\nif (idx >= queries.length) {\n_this.empty('Аниме не найдено в базе Kodik. Попробуйте переключить источник в Фильтре.');\nreturn;\n}\nvar url = KODIK_API + '?token=' + KODIK_TOKEN + '&limit=100&with_episodes=true&' + queries[idx];\nnetwork.clear();\nnetwork.timeout(12000);\nnetwork.silent(url, function (json) {\nif (json && Array.isArray(json.results) && json.results.length) {\n_this.prepareKodik(json.results);\n} else {\ntryNext(idx + 1);\n}\n}, function () {\ntryNext(idx + 1);\n});\n}\ntryNext(0);\n};\nthis.prepareKodik = function (results) {\nvar groupMap = {};\nvar groupOrder = [];\nresults.forEach(function (item) {\nvar tr = item.translation || {};\nvar trName = tr.title || 'Озвучка';\nvar trType = tr.type || 'voice';\nvar trLabel = trName + (trType === 'subtitles' ? ' [Субтитры]' : '');\nif (item.seasons && Object.keys(item.seasons).length) {\nObject.keys(item.seasons).forEach(function (sNum) {\nvar sObj = item.seasons[sNum] || {};\nvar gKey = (item.shikimori_id || item.title || 'anime') + '_s' + sNum;\nif (!groupMap[gKey]) {\nvar gTitle = item.title || item.title_orig || 'Аниме';\nif (gTitle.indexOf('ТВ') === -1 && gTitle.indexOf('сезон') === -1 && sNum !== '0' && sNum !== '1') {\ngTitle += ' (Сезон ' + sNum + ')';\n}\ngroupMap[gKey] = {\nkey: gKey,\ntitle: gTitle,\nyear: item.year || '',\nseasonNum: parseInt(sNum, 10) || 1,\nmainLink: fixProto(sObj.link || item.link),\ntranslations: []\n};\ngroupOrder.push(groupMap[gKey]);\n}\ngroupMap[gKey].translations.push({\nid: tr.id || trLabel,\nname: trLabel,\nrawName: trName,\ntype: trType,\nquality: item.quality || 'HD 720p/1080p',\nlink: fixProto(sObj.link || item.link),\nepisodes: sObj.episodes || {}\n});\n});\n} else {\nvar mKey = (item.shikimori_id || item.title || 'movie') + '_movie';\nif (!groupMap[mKey]) {\ngroupMap[mKey] = {\nkey: mKey,\ntitle: item.title || item.title_orig || 'Аниме-фильм',\nyear: item.year || '',\nseasonNum: 0,\nmainLink: fixProto(item.link),\ntranslations: []\n};\ngroupOrder.push(groupMap[mKey]);\n}\ngroupMap[mKey].translations.push({\nid: tr.id || trLabel,\nname: trLabel,\nrawName: trName,\ntype: trType,\nquality: item.quality || 'BDRip 1080p',\nlink: fixProto(item.link),\nepisodes: null\n});\n}\n});\ngroupOrder.sort(function (a, b) {\nif (a.year !== b.year) return (parseInt(a.year, 10) || 0) - (parseInt(b.year, 10) || 0);\nreturn a.seasonNum - b.seasonNum;\n});\ngroupOrder.forEach(function (g) {\ng.translations.sort(function (a, b) {\nvar pA = getTeamPriority(a.rawName, a.type);\nvar pB = getTeamPriority(b.rawName, b.type);\nif (pA !== pB) return pA - pB;\nreturn a.name.localeCompare(b.name);\n});\n});\nkodikGroups = groupOrder;\nchoice.season = 0;\nchoice.voice = 0;\nthis.buildKodikVoices();\nthis.renderKodik();\n};\nthis.buildKodikVoices = function () {\nkodikVoices = [];\nvar grp = kodikGroups[choice.season] || kodikGroups[0];\nif (!grp) return;\ngrp.translations.forEach(function (t, idx) {\nvar epCount = t.episodes ? Object.keys(t.episodes).length : 0;\nkodikVoices.push({\nindex: idx,\nname: t.name + (epCount ? ' (' + epCount + ' эп.)' : '')\n});\n});\n};\nthis.renderKodik = function () {\nvar _this = this;\nthis.activity.loader(false);\nscroll.clear();\nvar grp = kodikGroups[choice.season] || kodikGroups[0];\nif (!grp) {\nthis.empty('Нет доступных раздач Kodik');\nreturn;\n}\nvar tr = grp.translations[choice.voice] || grp.translations[0];\nthis.updateFilterUI(\nkodikGroups.map(function (g) { return g.title + (g.year ? ' (' + g.year + ')' : ''); }),\nkodikVoices.map(function (v) { return v.name; })\n);\nvar items = [];\nif (tr && tr.episodes && Object.keys(tr.episodes).length) {\nvar epNums = Object.keys(tr.episodes).sort(function (a, b) {\nreturn parseInt(a, 10) - parseInt(b, 10);\n});\nitems.push({\ntitle: '▶ Открыть общий плеер сезона (' + grp.translations.length + ' озвучек и субтитров внутри)',\nbadge: tr.quality || 'HD',\ninfo: grp.title + ' • Смена озвучки (AniDUB, AniLibria, Crunchyroll, Субтитры) прямо в углу плеера',\niframe: tr.link || grp.mainLink\n});\nepNums.forEach(function (epNum) {\nvar epLink = fixProto(tr.episodes[epNum]);\nitems.push({\ntitle: 'Серия ' + epNum + ' — ' + tr.name,\nbadge: tr.type === 'subtitles' ? 'SUB (Оригинал + Субтитры)' : (tr.quality || 'HD'),\ninfo: grp.title + ' • Перевод: ' + tr.name,\niframe: epLink + (epLink.indexOf('?') === -1 ? '?episode=' + epNum : '&episode=' + epNum)\n});\n});\n} else if (grp.translations.length) {\ngrp.translations.forEach(function (t) {\nitems.push({\ntitle: grp.title + ' — ' + t.name,\nbadge: t.type === 'subtitles' ? 'SUB (Субтитры)' : (t.quality || 'HD'),\ninfo: 'Полнометражное аниме • Перевод: ' + t.name,\niframe: t.link\n});\n});\n}\nthis.appendIframeCards(items);\n};\n/* ==================== 2. ANILIBRIA DIRECT 1080p ==================== */\nthis.searchLibria = function () {\nvar _this = this;\nvar movie = object.movie || {};\nvar queries = [];\nvar ruTitle = object.search || movie.title || movie.name || '';\nvar origTitle = movie.original_title || movie.original_name || '';\nif (ruTitle) queries.push(ruTitle);\nif (origTitle && origTitle !== ruTitle) queries.push(origTitle);\nif (!queries.length) {\nthis.empty('Нет названия для поиска в AniLibria');\nreturn;\n}\nfunction tryNext(idx) {\nif (idx >= queries.length) {\n_this.empty('Релиз не найден напрямую на AniLibria (он может быть доступен в источнике Kodik или Alloha).');\nreturn;\n}\nvar url = ANILIBRIA_API + '/app/search/releases?query=' + encodeURIComponent(queries[idx]);\nnetwork.clear();\nnetwork.timeout(10000);\nnetwork.silent(url, function (json) {\nif (Array.isArray(json) && json.length) {\nlibriaReleases = json;\nchoice.season = 0;\n_this.loadLibriaRelease(libriaReleases[0].id);\n} else {\ntryNext(idx + 1);\n}\n}, function () {\ntryNext(idx + 1);\n});\n}\ntryNext(0);\n};\nthis.loadLibriaRelease = function (releaseId) {\nvar _this = this;\nthis.activity.loader(true);\nnetwork.clear();\nnetwork.timeout(10000);\nnetwork.silent(ANILIBRIA_API + '/anime/releases/' + releaseId, function (json) {\nif (json && Array.isArray(json.episodes) && json.episodes.length) {\nlibriaCurrent = json;\n_this.renderLibria();\n} else {\n_this.empty('Эпизоды релиза AniLibria не найдены');\n}\n}, function () {\n_this.empty('Ошибка загрузки релиза с api.anilibria.app');\n});\n};\nthis.renderLibria = function () {\nvar _this = this;\nthis.activity.loader(false);\nscroll.clear();\nthis.updateFilterUI(\nlibriaReleases.map(function (r) {\nvar nm = (r.name && (r.name.main || r.name.english)) || 'Релиз';\nreturn nm + (r.year ? ' (' + r.year + ')' : '');\n}),\n['AniLibria.TV (Прямой поток 1080p FHD)']\n);\nvar eps = (libriaCurrent && libriaCurrent.episodes) || [];\nvar relTitle = (libriaCurrent && libriaCurrent.name && libriaCurrent.name.main) || 'AniLibria';\nvar playItems = eps.map(function (ep) {\nvar qMap = {};\nif (ep.hls_1080) qMap['1080p'] = ep.hls_1080;\nif (ep.hls_720) qMap['720p'] = ep.hls_720;\nif (ep.hls_480) qMap['480p'] = ep.hls_480;\nvar best = ep.hls_1080 || ep.hls_720 || ep.hls_480 || '';\nreturn {\ntitle: 'Серия ' + ep.ordinal + (ep.name ? ' — ' + ep.name : ''),\nbadge: ep.hls_1080 ? '1080p FHD (Прямой)' : '720p HD',\ninfo: relTitle + ' • Родной плеер Lampa без рекламы',\nfile: best,\nqualitys: qMap\n};\n});\nplayItems.forEach(function (element) {\nvar card = Lampa.Template.get('anime_hub_item', element);\ncard.on('hover:enter', function () {\nif (!element.file) {\nLampa.Noty.show('Поток отсутствует');\nreturn;\n}\nvar playlist = playItems.map(function (it) {\nreturn {\ntitle: it.title,\nurl: it.file,\nquality: it.qualitys\n};\n});\nLampa.Player.play({\ntitle: element.title,\nurl: element.file,\nquality: element.qualitys,\nplaylist: playlist\n});\nLampa.Player.playlist(playlist);\n});\nscroll.append(card);\n});\nthis.activity.toggle();\n};\n/* ==================== 3. ALLOHA ANIME 4K / FHD ==================== */\nthis.searchAlloha = function () {\nvar _this = this;\nvar movie = object.movie || {};\nvar queries = [];\nif (movie.kinopoisk_id) queries.push('kp=' + encodeURIComponent(movie.kinopoisk_id));\nif (movie.imdb_id) queries.push('imdb=' + encodeURIComponent(movie.imdb_id));\nif (movie.id) queries.push('tmdb=' + encodeURIComponent(movie.id));\nvar title = object.search || movie.title || movie.name || movie.original_title || movie.original_name || '';\nvar year = ((movie.release_date || movie.first_air_date || '') + '').slice(0, 4);\nif (title) queries.push('name=' + encodeURIComponent(title) + (year ? '&year=' + year : ''));\nfunction tryNext(idx) {\nif (idx >= queries.length) {\n_this.empty('Аниме не найдено в базе Alloha 4K');\nreturn;\n}\nvar url = ALLOHA_API + '?token=' + ALLOHA_TOKEN + '&' + queries[idx];\nnetwork.clear();\nnetwork.timeout(10000);\nnetwork.silent(url, function (json) {\nif (json && json.status === 'success' && json.data) {\nallohaData = json.data;\nallohaIsSerial = Boolean(allohaData.seasons && Object.keys(allohaData.seasons).length);\nif (allohaIsSerial) {\nallohaSeasons = Object.keys(allohaData.seasons).sort(function (a, b) {\nreturn parseInt(a, 10) - parseInt(b, 10);\n});\nchoice.season = 0;\n_this.buildAllohaVoices();\n} else {\nallohaSeasons = [];\nallohaVoices = [];\n}\n_this.renderAlloha();\n} else {\ntryNext(idx + 1);\n}\n}, function () {\ntryNext(idx + 1);\n});\n}\ntryNext(0);\n};\nthis.buildAllohaVoices = function () {\nallohaVoices = [{ id: 'all', name: 'Все озвучки и субтитры (выбор в плеере)' }];\nif (!allohaIsSerial || !allohaSeasons.length) return;\nvar sKey = allohaSeasons[choice.season] || allohaSeasons[0];\nvar sObj = allohaData.seasons[sKey];\nif (!sObj || !sObj.episodes) return;\nvar seen = {};\nObject.keys(sObj.episodes).forEach(function (epKey) {\nvar tr = (sObj.episodes[epKey] && sObj.episodes[epKey].translation) || {};\nObject.keys(tr).forEach(function (tId) {\nif (!seen[tId] && tr[tId] && tr[tId].translation) {\nseen[tId] = true;\nallohaVoices.push({\nid: tId,\nname: tr[tId].translation + (tr[tId].uhd ? ' (4K)' : '')\n});\n}\n});\n});\n};\nthis.renderAlloha = function () {\nthis.activity.loader(false);\nscroll.clear();\nthis.updateFilterUI(\nallohaSeasons.map(function (s) { return 'Сезон ' + s; }),\nallohaVoices.map(function (v) { return v.name; })\n);\nvar items = [];\nif (allohaIsSerial && allohaSeasons.length) {\nvar sKey = allohaSeasons[choice.season] || allohaSeasons[0];\nvar sObj = allohaData.seasons[sKey];\nvar epKeys = Object.keys((sObj && sObj.episodes) || {}).sort(function (a, b) {\nreturn parseInt(a, 10) - parseInt(b, 10);\n});\nvar selVoice = allohaVoices[choice.voice] ? allohaVoices[choice.voice].id : 'all';\nepKeys.forEach(function (epKey) {\nvar ep = sObj.episodes[epKey];\nvar tr = (ep && ep.translation) || {};\nif (selVoice !== 'all' && tr[selVoice]) {\nvar tObj = tr[selVoice];\nitems.push({\ntitle: 'Серия ' + ep.episode + ' — ' + tObj.translation,\nbadge: tObj.uhd ? '4K UHD (2160p)' : '1080p FHD',\ninfo: (tObj.quality || allohaData.quality || 'WEB-DL') + ' • База Alloha',\niframe: tObj.iframe\n});\n} else {\nvar hasUhd = false;\nvar names = [];\nObject.keys(tr).forEach(function (tId) {\nif (tr[tId].uhd) hasUhd = true;\nif (tr[tId].translation) names.push(tr[tId].translation);\n});\nitems.push({\ntitle: 'Серия ' + ep.episode,\nbadge: hasUhd ? '4K UHD (2160p)' : '1080p FHD',\ninfo: names.slice(0, 6).join(', ') + (names.length > 6 ? ' ...' : ''),\niframe: ep.iframe\n});\n}\n});\n} else if (allohaData) {\nvar trMap = allohaData.translation_iframe || {};\nvar trKeys = Object.keys(trMap);\nif (trKeys.length) {\ntrKeys.forEach(function (tId) {\nvar tObj = trMap[tId];\nitems.push({\ntitle: (allohaData.name || 'Аниме') + ' — ' + (tObj.name || 'Озвучка'),\nbadge: tObj.uhd ? '4K UHD (2160p)' : '1080p FHD',\ninfo: (tObj.quality || allohaData.quality || 'BDRip') + ' • База Alloha',\niframe: tObj.iframe\n});\n});\n} else if (allohaData.iframe) {\nitems.push({\ntitle: allohaData.name || 'Аниме',\nbadge: allohaData.uhd ? '4K UHD (2160p)' : '1080p FHD',\ninfo: allohaData.quality || 'BDRip',\niframe: allohaData.iframe\n});\n}\n}\nthis.appendIframeCards(items);\n};\n/* ==================== ОБЩИЕ МЕТОДЫ UI ==================== */\nthis.updateFilterUI = function (seasonNames, voiceNames) {\nvar select = [];\nvar chosen = [];\nselect.push({\ntitle: 'База (Источник)',\nsubtitle: sources[choice.source].name,\nitems: sources.map(function (s, i) {\nreturn { title: s.name, selected: i === choice.source, index: i };\n}),\nstype: 'source'\n});\nchosen.push(sources[choice.source].id.toUpperCase());\nif (seasonNames && seasonNames.length > 1) {\nselect.push({\ntitle: 'Сезон / Релиз',\nsubtitle: seasonNames[choice.season] || seasonNames[0],\nitems: seasonNames.map(function (s, i) {\nreturn { title: s, selected: i === choice.season, index: i };\n}),\nstype: 'season'\n});\nif (seasonNames[choice.season]) chosen.push(seasonNames[choice.season]);\n}\nif (voiceNames && voiceNames.length > 1) {\nselect.push({\ntitle: 'Озвучка / Субтитры',\nsubtitle: voiceNames[choice.voice] || voiceNames[0],\nitems: voiceNames.map(function (v, i) {\nreturn { title: v, selected: i === choice.voice, index: i };\n}),\nstype: 'voice'\n});\nif (voiceNames[choice.voice]) chosen.push(voiceNames[choice.voice]);\n}\nfilter.set('filter', select);\nfilter.chosen('filter', chosen);\n};\nthis.appendIframeCards = function (items) {\nvar _this = this;\nif (!items.length) {\nthis.empty('Раздачи не найдены. Попробуйте сменить базу в Фильтре.');\nreturn;\n}\nitems.forEach(function (element) {\nvar card = Lampa.Template.get('anime_hub_item', element);\ncard.on('hover:enter', function () {\nif (!element.iframe) {\nLampa.Noty.show('Ссылка на плеер отсутствует');\nreturn;\n}\nopenIframePlayer(element.iframe, element.title, function () {\n_this.activity.toggle();\n});\n});\nscroll.append(card);\n});\nthis.activity.toggle();\n};\nthis.empty = function (msg) {\nthis.activity.loader(false);\nscroll.clear();\nthis.updateFilterUI([], []);\nvar empty = new Lampa.Empty({ descr: msg });\nscroll.append(empty.render(filter.empty()));\nthis.start = empty.start;\nthis.activity.toggle();\n};\nthis.start = function () {\nLampa.Controller.add('content', {\ntoggle: function () {\nLampa.Controller.collectionSet(scroll.render(), files.render());\nLampa.Controller.collectionFocus(false, scroll.render());\n},\nup: function () {\nif (Navigator.canmove('up')) Navigator.move('up');\nelse Lampa.Controller.toggle('head');\n},\ndown: function () {\nNavigator.move('down');\n},\nright: function () {\nNavigator.move('right');\n},\nleft: function () {\nif (Navigator.canmove('left')) Navigator.move('left');\nelse Lampa.Controller.toggle('menu');\n},\nback: function () {\nLampa.Activity.backward();\n}\n});\nLampa.Controller.toggle('content');\n};\nthis.pause = function () {};\nthis.stop = function () {};\nthis.render = function () {\nreturn files.render();\n};\nthis.destroy = function () {\n$('.anime-hub-iframe-modal').remove();\n$(window).off('keydown.anime_hub_modal');\nnetwork.clear();\nscroll.destroy();\nfiles.destroy();\nfilter.destroy();\n};\n}\nfunction initPlugin() {\nLampa.Template.add('anime_hub_item', '<div class=\"online selector\" style=\"padding: 1.1em 1.4em; margin-bottom: 0.7em; border-radius: 0.5em; background: rgba(255,255,255,0.06); display: flex; justify-content: space-between; align-items: center;\">' +\n'<div class=\"online__body\" style=\"padding-right: 1em;\">' +\n'<div class=\"online__title\" style=\"font-size: 1.15em; font-weight: 600;\">{title}</div>' +\n'<div class=\"online__info\" style=\"opacity: 0.72; margin-top: 0.35em; font-size: 0.92em;\">{info}</div>' +\n'</div>' +\n'<div style=\"background: rgba(247, 37, 133, 0.22); border: 1px solid rgba(247, 37, 133, 0.55); color: #ff85c0; padding: 0.35em 0.75em; border-radius: 0.35em; font-weight: 700; font-size: 0.9em; white-space: nowrap;\">{badge}</div>' +\n'</div>');\nLampa.Component.add('anime_hub', AnimeHubComponent);\nLampa.Listener.follow('full', function (e) {\nif (e.type === 'complite') {\nvar btn = $('<div class=\"full-start__button selector view--online\">' +\n'<svg viewBox=\"0 0 24 24\" fill=\"none\" width=\"24\" height=\"24\" stroke=\"currentColor\" stroke-width=\"2\" style=\"margin-right: 0.4em;\"><path d=\"M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z\"/></svg>' +\n'<span>Аниме</span>' +\n'</div>');\nbtn.on('hover:enter', function () {\nLampa.Activity.push({\nurl: '',\ntitle: 'Аниме (AniDUB / AniLibria / Crunchyroll / SUB)',\ncomponent: 'anime_hub',\nmovie: e.data.movie,\npage: 1\n});\n});\ne.object.activity.render().find('.view--torrent').after(btn);\n}\n});\n}\nif (window.appready) initPlugin();\nelse {\nLampa.Listener.follow('app', function (e) {\nif (e.type === 'ready') initPlugin();\n});\n}\n})();\n\n(function () {\n'use strict';\nif (window.plugin_lordfilm_4k_ready) return;\nwindow.plugin_lordfilm_4k_ready = true;\nvar API_URL = 'https://api.apbugall.org/';\nvar TOKEN = 'ec4acf58bc9bf62f8be18cad95484c';\nfunction openIframePlayer(iframeUrl, title, onClose) {\n$('meta[name=\"referrer\"]').attr('content', 'origin');\n$('.lordfilm-iframe-modal').remove();\nvar modal = $('<div class=\"lordfilm-iframe-modal\" style=\"position:fixed;top:0;left:0;width:100%;height:100%;z-index:99999;background:#000;display:flex;flex-direction:column;\">' +\n'<div class=\"lordfilm-iframe-header\" style=\"height:3.2em;background:rgba(15,15,15,0.95);display:flex;align-items:center;justify-content:space-between;padding:0 1.5em;color:#fff;border-bottom:1px solid rgba(255,255,255,0.12);flex-shrink:0;\">' +\n'<div style=\"font-size:1.15em;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;\">' + (title || 'Lordfilm 4K') + '</div>' +\n'<div class=\"lordfilm-iframe-close selector\" style=\"padding:0.45em 1em;background:rgba(255,255,255,0.14);border-radius:0.4em;cursor:pointer;font-size:0.95em;font-weight:500;\">Закрыть (Esc / Назад)</div>' +\n'</div>' +\n'<div style=\"flex:1;position:relative;width:100%;height:100%;\">' +\n'<iframe sandbox=\"allow-scripts allow-same-origin\" referrerpolicy=\"origin\" src=\"' + iframeUrl + '\" style=\"position:absolute;top:0;left:0;width:100%;height:100%;border:0;\" allow=\"autoplay; fullscreen; encrypted-media; picture-in-picture\" allowfullscreen></iframe>' +\n'</div>' +\n'</div>');\nfunction closeModal() {\n$(window).off('keydown.lordfilm_modal');\nmodal.remove();\nif (onClose) onClose();\n}\nmodal.find('.lordfilm-iframe-close').on('click hover:enter', function () {\ncloseModal();\n});\n$(window).on('keydown.lordfilm_modal', function (e) {\nif (e.keyCode === 27 || e.keyCode === 8 || e.keyCode === 461 || e.keyCode === 10009) {\ne.preventDefault();\ne.stopPropagation();\ncloseModal();\n}\n});\n$('body').append(modal);\nLampa.Controller.add('lordfilm_iframe', {\ntoggle: function () {\nLampa.Controller.collectionSet(modal);\nLampa.Controller.collectionFocus(modal.find('.lordfilm-iframe-close')[0], modal);\n},\nback: function () {\ncloseModal();\n}\n});\nLampa.Controller.toggle('lordfilm_iframe');\n}\nfunction LordfilmComponent(object) {\nvar network = new Lampa.Reguest();\nvar scroll = new Lampa.Scroll({ mask: true, over: true });\nvar files = new Lampa.Explorer(object);\nvar filter = new Lampa.Filter(object);\nvar data = null;\nvar isSerial = false;\nvar seasonsList = [];\nvar voicesList = [];\nvar choice = {\nseason: 0,\nvoice: 0\n};\nthis.create = function () {\nvar _this = this;\nthis.activity.loader(true);\nthis.closeFilter = function () {\nif ($('body').hasClass('selectbox--open')) Lampa.Select.close();\n};\nfilter.onSearch = function (value) {\nLampa.Activity.replace({\nsearch: value,\nclarification: true\n});\n};\nfilter.onSelect = function (type, a, b) {\nif (type === 'filter') {\nif (a.stype === 'season' && b) {\nchoice.season = b.index;\nchoice.voice = 0;\nsetTimeout(_this.closeFilter, 10);\n_this.rebuildVoices();\n_this.renderItems();\n} else if (a.stype === 'voice' && b) {\nchoice.voice = b.index;\nsetTimeout(_this.closeFilter, 10);\n_this.renderItems();\n}\n}\n};\nfilter.onBack = function () {\n_this.start();\n};\nscroll.body().addClass('torrent-list');\nfiles.appendFiles(scroll.render());\nfiles.appendHead(filter.render());\nscroll.minus(files.render().find('.explorer__files-head'));\nthis.search();\nreturn this.render();\n};\nthis.search = function () {\nvar _this = this;\nvar movie = object.movie || {};\nvar queries = [];\nif (movie.kinopoisk_id) queries.push('kp=' + encodeURIComponent(movie.kinopoisk_id));\nif (movie.imdb_id) queries.push('imdb=' + encodeURIComponent(movie.imdb_id));\nif (movie.id) queries.push('tmdb=' + encodeURIComponent(movie.id));\nvar title = object.search || movie.title || movie.name || movie.original_title || movie.original_name || '';\nvar year = ((movie.release_date || movie.first_air_date || '') + '').slice(0, 4);\nif (title) {\nqueries.push('name=' + encodeURIComponent(title) + (year ? '&year=' + year : ''));\n}\nif (!queries.length) {\nthis.empty('Не удалось определить ID или название фильма');\nreturn;\n}\nfunction tryQuery(idx) {\nif (idx >= queries.length) {\n_this.empty('Фильм не найден в базе Lordfilm 4K (Alloha)');\nreturn;\n}\nvar url = API_URL + '?token=' + TOKEN + '&' + queries[idx];\nnetwork.clear();\nnetwork.timeout(10000);\nnetwork.silent(url, function (json) {\nif (json && json.status === 'success' && json.data) {\ndata = json.data;\n_this.prepareData();\n} else {\ntryQuery(idx + 1);\n}\n}, function () {\ntryQuery(idx + 1);\n});\n}\ntryQuery(0);\n};\nthis.prepareData = function () {\nisSerial = Boolean(data.seasons && Object.keys(data.seasons).length);\nif (isSerial) {\nseasonsList = Object.keys(data.seasons).sort(function (a, b) {\nreturn parseInt(a, 10) - parseInt(b, 10);\n});\nchoice.season = 0;\nthis.rebuildVoices();\n} else {\nseasonsList = [];\nvoicesList = [];\n}\nthis.renderItems();\n};\nthis.rebuildVoices = function () {\nvoicesList = [{ id: 'all', name: 'Все озвучки (выбор в плеере)' }];\nif (!isSerial || !seasonsList.length) return;\nvar sKey = seasonsList[choice.season] || seasonsList[0];\nvar seasonObj = data.seasons[sKey];\nif (!seasonObj || !seasonObj.episodes) return;\nvar seen = {};\nObject.keys(seasonObj.episodes).forEach(function (epKey) {\nvar ep = seasonObj.episodes[epKey];\nvar tr = (ep && ep.translation) || {};\nObject.keys(tr).forEach(function (tId) {\nif (!seen[tId] && tr[tId] && tr[tId].translation) {\nseen[tId] = true;\nvoicesList.push({\nid: tId,\nname: tr[tId].translation + (tr[tId].uhd ? ' (4K)' : '')\n});\n}\n});\n});\n};\nthis.updateFilter = function () {\nvar select = [];\nvar chosen = [];\nif (isSerial && seasonsList.length > 1) {\nselect.push({\ntitle: 'Сезон',\nsubtitle: 'Сезон ' + seasonsList[choice.season],\nitems: seasonsList.map(function (s, i) {\nreturn { title: 'Сезон ' + s, selected: i === choice.season, index: i };\n}),\nstype: 'season'\n});\nchosen.push('Сезон ' + seasonsList[choice.season]);\n}\nif (isSerial && voicesList.length > 1) {\nselect.push({\ntitle: 'Озвучка',\nsubtitle: voicesList[choice.voice] ? voicesList[choice.voice].name : '',\nitems: voicesList.map(function (v, i) {\nreturn { title: v.name, selected: i === choice.voice, index: i };\n}),\nstype: 'voice'\n});\nif (voicesList[choice.voice]) chosen.push(voicesList[choice.voice].name);\n}\nfilter.set('filter', select);\nfilter.chosen('filter', chosen);\n};\nthis.renderItems = function () {\nvar _this = this;\nthis.activity.loader(false);\nscroll.clear();\nthis.updateFilter();\nvar items = [];\nif (isSerial && seasonsList.length) {\nvar sKey = seasonsList[choice.season] || seasonsList[0];\nvar seasonObj = data.seasons[sKey];\nvar epKeys = Object.keys((seasonObj && seasonObj.episodes) || {}).sort(function (a, b) {\nreturn parseInt(a, 10) - parseInt(b, 10);\n});\nvar selectedVoice = voicesList[choice.voice] ? voicesList[choice.voice].id : 'all';\nepKeys.forEach(function (epKey) {\nvar ep = seasonObj.episodes[epKey];\nvar tr = (ep && ep.translation) || {};\nif (selectedVoice !== 'all' && tr[selectedVoice]) {\nvar tObj = tr[selectedVoice];\nitems.push({\ntitle: 'Серия ' + ep.episode + ' — ' + tObj.translation,\nbadge: tObj.uhd ? '4K UHD (2160p)' : '1080p FHD',\ninfo: (tObj.quality || data.quality || 'WEB-DL') + (tObj.adv ? ' • Есть реклама балансера' : ' • Без вшитой рекламы'),\niframe: tObj.iframe\n});\n} else {\nvar hasUhd = false;\nvar tNames = [];\nObject.keys(tr).forEach(function (tId) {\nif (tr[tId].uhd) hasUhd = true;\nif (tr[tId].translation) tNames.push(tr[tId].translation + (tr[tId].uhd ? ' [4K]' : ''));\n});\nitems.push({\ntitle: 'Серия ' + ep.episode,\nbadge: hasUhd ? '4K UHD (2160p)' : '1080p FHD',\ninfo: tNames.slice(0, 5).join(', ') + (tNames.length > 5 ? ' ...' : ''),\niframe: ep.iframe\n});\n}\n});\n} else if (data) {\nvar trMap = data.translation_iframe || {};\nvar trKeys = Object.keys(trMap);\nif (trKeys.length) {\ntrKeys.sort(function (a, b) {\nvar uA = trMap[a].uhd ? 1 : 0;\nvar uB = trMap[b].uhd ? 1 : 0;\nreturn uB - uA;\n});\ntrKeys.forEach(function (tId) {\nvar tObj = trMap[tId];\nitems.push({\ntitle: (data.name || 'Фильм') + ' — ' + (tObj.name || 'Озвучка'),\nbadge: tObj.uhd ? '4K UHD (2160p)' : '1080p FHD',\ninfo: (tObj.quality || data.quality || 'BDRip') + (tObj.adv ? ' • Есть вшитая реклама' : ' • Без вшитой рекламы'),\niframe: tObj.iframe\n});\n});\n} else if (data.iframe) {\nitems.push({\ntitle: data.name || 'Фильм',\nbadge: data.uhd ? '4K UHD (2160p)' : '1080p FHD',\ninfo: (data.quality || 'BDRip') + (data.translation ? ' • ' + data.translation : ''),\niframe: data.iframe\n});\n}\n}\nif (!items.length) {\nthis.empty('Потоки для этого фильма не найдены');\nreturn;\n}\nitems.forEach(function (element) {\nvar card = Lampa.Template.get('lordfilm_4k_item', element);\ncard.on('hover:enter', function () {\nif (!element.iframe) {\nLampa.Noty.show('Ссылка на плеер отсутствует');\nreturn;\n}\nopenIframePlayer(element.iframe, element.title, function () {\n_this.activity.toggle();\n});\n});\nscroll.append(card);\n});\nthis.activity.toggle();\n};\nthis.empty = function (msg) {\nthis.activity.loader(false);\nscroll.clear();\nvar empty = new Lampa.Empty({ descr: msg });\nscroll.append(empty.render(filter.empty()));\nthis.start = empty.start;\nthis.activity.toggle();\n};\nthis.start = function () {\nLampa.Controller.add('content', {\ntoggle: function () {\nLampa.Controller.collectionSet(scroll.render(), files.render());\nLampa.Controller.collectionFocus(false, scroll.render());\n},\nup: function () {\nif (Navigator.canmove('up')) Navigator.move('up');\nelse Lampa.Controller.toggle('head');\n},\ndown: function () {\nNavigator.move('down');\n},\nright: function () {\nNavigator.move('right');\n},\nleft: function () {\nif (Navigator.canmove('left')) Navigator.move('left');\nelse Lampa.Controller.toggle('menu');\n},\nback: function () {\nLampa.Activity.backward();\n}\n});\nLampa.Controller.toggle('content');\n};\nthis.pause = function () {};\nthis.stop = function () {};\nthis.render = function () {\nreturn files.render();\n};\nthis.destroy = function () {\n$('.lordfilm-iframe-modal').remove();\n$(window).off('keydown.lordfilm_modal');\nnetwork.clear();\nscroll.destroy();\nfiles.destroy();\nfilter.destroy();\n};\n}\nfunction initPlugin() {\nLampa.Template.add('lordfilm_4k_item', '<div class=\"online selector\" style=\"padding: 1.1em 1.4em; margin-bottom: 0.7em; border-radius: 0.5em; background: rgba(255,255,255,0.06); display: flex; justify-content: space-between; align-items: center;\">' +\n'<div class=\"online__body\" style=\"padding-right: 1em;\">' +\n'<div class=\"online__title\" style=\"font-size: 1.15em; font-weight: 600;\">{title}</div>' +\n'<div class=\"online__info\" style=\"opacity: 0.7; margin-top: 0.35em; font-size: 0.92em;\">{info}</div>' +\n'</div>' +\n'<div style=\"background: rgba(72, 149, 239, 0.22); border: 1px solid rgba(72, 149, 239, 0.55); color: #7cc6fe; padding: 0.35em 0.75em; border-radius: 0.35em; font-weight: 700; font-size: 0.9em; white-space: nowrap;\">{badge}</div>' +\n'</div>');\nLampa.Component.add('lordfilm_4k', LordfilmComponent);\nLampa.Listener.follow('full', function (e) {\nif (e.type === 'complite') {\nvar btn = $('<div class=\"full-start__button selector view--online\">' +\n'<svg viewBox=\"0 0 24 24\" fill=\"none\" width=\"24\" height=\"24\" stroke=\"currentColor\" stroke-width=\"2\" style=\"margin-right: 0.4em;\"><circle cx=\"12\" cy=\"12\" r=\"10\"/><polygon points=\"10 8 16 12 10 16 10 8\" fill=\"currentColor\"/></svg>' +\n'<span>Lordfilm 4K</span>' +\n'</div>');\nbtn.on('hover:enter', function () {\nLampa.Activity.push({\nurl: '',\ntitle: 'Lordfilm 4K',\ncomponent: 'lordfilm_4k',\nmovie: e.data.movie,\npage: 1\n});\n});\ne.object.activity.render().find('.view--torrent').after(btn);\n}\n});\n}\nif (window.appready) initPlugin();\nelse {\nLampa.Listener.follow('app', function (e) {\nif (e.type === 'ready') initPlugin();\n});\n}\n})();";

    function syncPluginMemory() {
        try {
            if (!window.Lampa) return;
            var matchedUrl = __baseSrc;
            if (Lampa.Plugins && Lampa.Plugins.get) {
                var list = Lampa.Plugins.get();
                var changed = false;
                for (var i = 0; i < list.length; i++) {
                    var u = (list[i].url || '') + '';
                    var uBase = u.split('?')[0];
                    if (u && (__baseSrc && (uBase === __baseSrc || __scriptSrc.indexOf(uBase) !== -1))) {
                        matchedUrl = u;
                        if (list[i].name !== __pluginName) { list[i].name = __pluginName; changed = true; }
                        if (list[i].author !== '@custom') { list[i].author = '@custom'; changed = true; }
                        if (list[i].descr !== __pluginDescr) { list[i].descr = __pluginDescr; changed = true; }
                    }
                }
                if (changed && Lampa.Plugins.save) Lampa.Plugins.save();
            }
            if (matchedUrl && Lampa.Cache && Lampa.Cache.rewriteData) {
                Lampa.Cache.rewriteData('plugins', matchedUrl, __rawCode);
            }
        } catch (e) {}
    }

    if (window.Lampa && window.appready) {
        syncPluginMemory();
    } else if (window.Lampa && Lampa.Listener) {
        syncPluginMemory();
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') syncPluginMemory();
        });
    } else {
        setTimeout(syncPluginMemory, 2000);
    }
})();

(function () {
'use strict';
if (window.plugin_anime_hub_ready) return;
window.plugin_anime_hub_ready = true;
var KODIK_API = 'https://kodik-api.com/search';
var KODIK_TOKEN = '41dd95f84c21719b09d6c71182237a25';
var ANILIBRIA_API = 'https://api.anilibria.app/api/v1';
var ALLOHA_API = 'https://api.apbugall.org/';
var ALLOHA_TOKEN = 'ec4acf58bc9bf62f8be18cad95484c';
var PRIORITY_TEAMS = [
'crunchyroll', 'anilibria', 'aniliberty', 'anidub', 'animedia',
'studio band', 'студийная банда', 'shiza', 'dream cast', 'jam',
'animevost', 'anistar', 'onwave', 'ancord', 'subtitles', 'субтитры'
];
function getTeamPriority(name, type) {
var low = (name || '').toLowerCase();
for (var i = 0; i < PRIORITY_TEAMS.length; i++) {
if (low.indexOf(PRIORITY_TEAMS[i]) !== -1) return i;
}
if (type === 'subtitles') return PRIORITY_TEAMS.length;
return 999;
}
function fixProto(url) {
if (!url) return '';
if (url.indexOf('//') === 0) return 'https:' + url;
return url;
}
function openIframePlayer(iframeUrl, title, onClose) {
$('meta[name="referrer"]').attr('content', 'origin');
$('.anime-hub-iframe-modal').remove();
var fullUrl = fixProto(iframeUrl);
var modal = $('<div class="anime-hub-iframe-modal" style="position:fixed;top:0;left:0;width:100%;height:100%;z-index:99999;background:#000;display:flex;flex-direction:column;">' +
'<div class="anime-hub-iframe-header" style="height:3.2em;background:rgba(15,15,15,0.95);display:flex;align-items:center;justify-content:space-between;padding:0 1.5em;color:#fff;border-bottom:1px solid rgba(255,255,255,0.12);flex-shrink:0;">' +
'<div style="font-size:1.15em;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + (title || 'Anime Hub') + '</div>' +
'<div class="anime-hub-iframe-close selector" style="padding:0.45em 1em;background:rgba(255,255,255,0.14);border-radius:0.4em;cursor:pointer;font-size:0.95em;font-weight:500;">Закрыть (Esc / Назад)</div>' +
'</div>' +
'<div style="flex:1;position:relative;width:100%;height:100%;">' +
'<iframe sandbox="allow-scripts allow-same-origin" referrerpolicy="origin" src="' + fullUrl + '" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;" allow="autoplay; fullscreen; encrypted-media; picture-in-picture" allowfullscreen></iframe>' +
'</div>' +
'</div>');
function closeModal() {
$(window).off('keydown.anime_hub_modal');
modal.remove();
if (onClose) onClose();
}
modal.find('.anime-hub-iframe-close').on('click hover:enter', function () {
closeModal();
});
$(window).on('keydown.anime_hub_modal', function (e) {
if (e.keyCode === 27 || e.keyCode === 8 || e.keyCode === 461 || e.keyCode === 10009) {
e.preventDefault();
e.stopPropagation();
closeModal();
}
});
$('body').append(modal);
Lampa.Controller.add('anime_hub_iframe', {
toggle: function () {
Lampa.Controller.collectionSet(modal);
Lampa.Controller.collectionFocus(modal.find('.anime-hub-iframe-close')[0], modal);
},
back: function () {
closeModal();
}
});
Lampa.Controller.toggle('anime_hub_iframe');
}
function AnimeHubComponent(object) {
var network = new Lampa.Reguest();
var scroll = new Lampa.Scroll({ mask: true, over: true });
var files = new Lampa.Explorer(object);
var filter = new Lampa.Filter(object);
var sources = [
{ id: 'kodik', name: 'Kodik (AniDUB / AniLibria / Animedia / Crunchyroll / Субтитры)' },
{ id: 'anilibria', name: 'AniLibria Direct (Прямой поток 1080p без рекламы)' },
{ id: 'alloha', name: 'Alloha Anime (4K UHD / 1080p + Озвучки и Субтитры)' }
];
var choice = {
source: 0,
season: 0,
voice: 0
};
var kodikGroups = [];
var kodikVoices = [];
var libriaReleases = [];
var libriaCurrent = null;
var allohaData = null;
var allohaIsSerial = false;
var allohaSeasons = [];
var allohaVoices = [];
this.create = function () {
var _this = this;
this.activity.loader(true);
this.closeFilter = function () {
if ($('body').hasClass('selectbox--open')) Lampa.Select.close();
};
filter.onSearch = function (value) {
Lampa.Activity.replace({
search: value,
clarification: true
});
};
filter.onSelect = function (type, a, b) {
if (type === 'filter') {
if (a.stype === 'source' && b) {
choice.source = b.index;
choice.season = 0;
choice.voice = 0;
setTimeout(_this.closeFilter, 10);
_this.loadSource();
} else if (a.stype === 'season' && b) {
choice.season = b.index;
choice.voice = 0;
setTimeout(_this.closeFilter, 10);
var srcId = sources[choice.source].id;
if (srcId === 'kodik') {
_this.buildKodikVoices();
_this.renderKodik();
} else if (srcId === 'anilibria') {
_this.loadLibriaRelease(libriaReleases[choice.season].id);
} else if (srcId === 'alloha') {
_this.buildAllohaVoices();
_this.renderAlloha();
}
} else if (a.stype === 'voice' && b) {
choice.voice = b.index;
setTimeout(_this.closeFilter, 10);
var srcId2 = sources[choice.source].id;
if (srcId2 === 'kodik') _this.renderKodik();
else if (srcId2 === 'alloha') _this.renderAlloha();
}
} else if (type === 'sort' && a) {
choice.source = a.index || 0;
choice.season = 0;
choice.voice = 0;
setTimeout(_this.closeFilter, 10);
_this.loadSource();
}
};
filter.onBack = function () {
_this.start();
};
scroll.body().addClass('torrent-list');
files.appendFiles(scroll.render());
files.appendHead(filter.render());
scroll.minus(files.render().find('.explorer__files-head'));
this.loadSource();
return this.render();
};
this.loadSource = function () {
var srcId = sources[choice.source].id;
this.activity.loader(true);
scroll.clear();
if (srcId === 'kodik') this.searchKodik();
else if (srcId === 'anilibria') this.searchLibria();
else if (srcId === 'alloha') this.searchAlloha();
};
/* ==================== 1. KODIK ==================== */
this.searchKodik = function () {
var _this = this;
var movie = object.movie || {};
var queries = [];
if (movie.kinopoisk_id) queries.push('kinopoisk_id=' + encodeURIComponent(movie.kinopoisk_id));
if (movie.imdb_id) queries.push('imdb_id=' + encodeURIComponent(movie.imdb_id));
var ruTitle = object.search || movie.title || movie.name || '';
var origTitle = movie.original_title || movie.original_name || '';
if (ruTitle) queries.push('title=' + encodeURIComponent(ruTitle));
if (origTitle && origTitle !== ruTitle) queries.push('title_orig=' + encodeURIComponent(origTitle));
if (!queries.length) {
this.empty('Нет данных для поиска аниме');
return;
}
function tryNext(idx) {
if (idx >= queries.length) {
_this.empty('Аниме не найдено в базе Kodik. Попробуйте переключить источник в Фильтре.');
return;
}
var url = KODIK_API + '?token=' + KODIK_TOKEN + '&limit=100&with_episodes=true&' + queries[idx];
network.clear();
network.timeout(12000);
network.silent(url, function (json) {
if (json && Array.isArray(json.results) && json.results.length) {
_this.prepareKodik(json.results);
} else {
tryNext(idx + 1);
}
}, function () {
tryNext(idx + 1);
});
}
tryNext(0);
};
this.prepareKodik = function (results) {
var groupMap = {};
var groupOrder = [];
results.forEach(function (item) {
var tr = item.translation || {};
var trName = tr.title || 'Озвучка';
var trType = tr.type || 'voice';
var trLabel = trName + (trType === 'subtitles' ? ' [Субтитры]' : '');
if (item.seasons && Object.keys(item.seasons).length) {
Object.keys(item.seasons).forEach(function (sNum) {
var sObj = item.seasons[sNum] || {};
var gKey = (item.shikimori_id || item.title || 'anime') + '_s' + sNum;
if (!groupMap[gKey]) {
var gTitle = item.title || item.title_orig || 'Аниме';
if (gTitle.indexOf('ТВ') === -1 && gTitle.indexOf('сезон') === -1 && sNum !== '0' && sNum !== '1') {
gTitle += ' (Сезон ' + sNum + ')';
}
groupMap[gKey] = {
key: gKey,
title: gTitle,
year: item.year || '',
seasonNum: parseInt(sNum, 10) || 1,
mainLink: fixProto(sObj.link || item.link),
translations: []
};
groupOrder.push(groupMap[gKey]);
}
groupMap[gKey].translations.push({
id: tr.id || trLabel,
name: trLabel,
rawName: trName,
type: trType,
quality: item.quality || 'HD 720p/1080p',
link: fixProto(sObj.link || item.link),
episodes: sObj.episodes || {}
});
});
} else {
var mKey = (item.shikimori_id || item.title || 'movie') + '_movie';
if (!groupMap[mKey]) {
groupMap[mKey] = {
key: mKey,
title: item.title || item.title_orig || 'Аниме-фильм',
year: item.year || '',
seasonNum: 0,
mainLink: fixProto(item.link),
translations: []
};
groupOrder.push(groupMap[mKey]);
}
groupMap[mKey].translations.push({
id: tr.id || trLabel,
name: trLabel,
rawName: trName,
type: trType,
quality: item.quality || 'BDRip 1080p',
link: fixProto(item.link),
episodes: null
});
}
});
groupOrder.sort(function (a, b) {
if (a.year !== b.year) return (parseInt(a.year, 10) || 0) - (parseInt(b.year, 10) || 0);
return a.seasonNum - b.seasonNum;
});
groupOrder.forEach(function (g) {
g.translations.sort(function (a, b) {
var pA = getTeamPriority(a.rawName, a.type);
var pB = getTeamPriority(b.rawName, b.type);
if (pA !== pB) return pA - pB;
return a.name.localeCompare(b.name);
});
});
kodikGroups = groupOrder;
choice.season = 0;
choice.voice = 0;
this.buildKodikVoices();
this.renderKodik();
};
this.buildKodikVoices = function () {
kodikVoices = [];
var grp = kodikGroups[choice.season] || kodikGroups[0];
if (!grp) return;
grp.translations.forEach(function (t, idx) {
var epCount = t.episodes ? Object.keys(t.episodes).length : 0;
kodikVoices.push({
index: idx,
name: t.name + (epCount ? ' (' + epCount + ' эп.)' : '')
});
});
};
this.renderKodik = function () {
var _this = this;
this.activity.loader(false);
scroll.clear();
var grp = kodikGroups[choice.season] || kodikGroups[0];
if (!grp) {
this.empty('Нет доступных раздач Kodik');
return;
}
var tr = grp.translations[choice.voice] || grp.translations[0];
this.updateFilterUI(
kodikGroups.map(function (g) { return g.title + (g.year ? ' (' + g.year + ')' : ''); }),
kodikVoices.map(function (v) { return v.name; })
);
var items = [];
if (tr && tr.episodes && Object.keys(tr.episodes).length) {
var epNums = Object.keys(tr.episodes).sort(function (a, b) {
return parseInt(a, 10) - parseInt(b, 10);
});
items.push({
title: '▶ Открыть общий плеер сезона (' + grp.translations.length + ' озвучек и субтитров внутри)',
badge: tr.quality || 'HD',
info: grp.title + ' • Смена озвучки (AniDUB, AniLibria, Crunchyroll, Субтитры) прямо в углу плеера',
iframe: tr.link || grp.mainLink
});
epNums.forEach(function (epNum) {
var epLink = fixProto(tr.episodes[epNum]);
items.push({
title: 'Серия ' + epNum + ' — ' + tr.name,
badge: tr.type === 'subtitles' ? 'SUB (Оригинал + Субтитры)' : (tr.quality || 'HD'),
info: grp.title + ' • Перевод: ' + tr.name,
iframe: epLink + (epLink.indexOf('?') === -1 ? '?episode=' + epNum : '&episode=' + epNum)
});
});
} else if (grp.translations.length) {
grp.translations.forEach(function (t) {
items.push({
title: grp.title + ' — ' + t.name,
badge: t.type === 'subtitles' ? 'SUB (Субтитры)' : (t.quality || 'HD'),
info: 'Полнометражное аниме • Перевод: ' + t.name,
iframe: t.link
});
});
}
this.appendIframeCards(items);
};
/* ==================== 2. ANILIBRIA DIRECT 1080p ==================== */
this.searchLibria = function () {
var _this = this;
var movie = object.movie || {};
var queries = [];
var ruTitle = object.search || movie.title || movie.name || '';
var origTitle = movie.original_title || movie.original_name || '';
if (ruTitle) queries.push(ruTitle);
if (origTitle && origTitle !== ruTitle) queries.push(origTitle);
if (!queries.length) {
this.empty('Нет названия для поиска в AniLibria');
return;
}
function tryNext(idx) {
if (idx >= queries.length) {
_this.empty('Релиз не найден напрямую на AniLibria (он может быть доступен в источнике Kodik или Alloha).');
return;
}
var url = ANILIBRIA_API + '/app/search/releases?query=' + encodeURIComponent(queries[idx]);
network.clear();
network.timeout(10000);
network.silent(url, function (json) {
if (Array.isArray(json) && json.length) {
libriaReleases = json;
choice.season = 0;
_this.loadLibriaRelease(libriaReleases[0].id);
} else {
tryNext(idx + 1);
}
}, function () {
tryNext(idx + 1);
});
}
tryNext(0);
};
this.loadLibriaRelease = function (releaseId) {
var _this = this;
this.activity.loader(true);
network.clear();
network.timeout(10000);
network.silent(ANILIBRIA_API + '/anime/releases/' + releaseId, function (json) {
if (json && Array.isArray(json.episodes) && json.episodes.length) {
libriaCurrent = json;
_this.renderLibria();
} else {
_this.empty('Эпизоды релиза AniLibria не найдены');
}
}, function () {
_this.empty('Ошибка загрузки релиза с api.anilibria.app');
});
};
this.renderLibria = function () {
var _this = this;
this.activity.loader(false);
scroll.clear();
this.updateFilterUI(
libriaReleases.map(function (r) {
var nm = (r.name && (r.name.main || r.name.english)) || 'Релиз';
return nm + (r.year ? ' (' + r.year + ')' : '');
}),
['AniLibria.TV (Прямой поток 1080p FHD)']
);
var eps = (libriaCurrent && libriaCurrent.episodes) || [];
var relTitle = (libriaCurrent && libriaCurrent.name && libriaCurrent.name.main) || 'AniLibria';
var playItems = eps.map(function (ep) {
var qMap = {};
if (ep.hls_1080) qMap['1080p'] = ep.hls_1080;
if (ep.hls_720) qMap['720p'] = ep.hls_720;
if (ep.hls_480) qMap['480p'] = ep.hls_480;
var best = ep.hls_1080 || ep.hls_720 || ep.hls_480 || '';
return {
title: 'Серия ' + ep.ordinal + (ep.name ? ' — ' + ep.name : ''),
badge: ep.hls_1080 ? '1080p FHD (Прямой)' : '720p HD',
info: relTitle + ' • Родной плеер Lampa без рекламы',
file: best,
qualitys: qMap
};
});
playItems.forEach(function (element) {
var card = Lampa.Template.get('anime_hub_item', element);
card.on('hover:enter', function () {
if (!element.file) {
Lampa.Noty.show('Поток отсутствует');
return;
}
var playlist = playItems.map(function (it) {
return {
title: it.title,
url: it.file,
quality: it.qualitys
};
});
Lampa.Player.play({
title: element.title,
url: element.file,
quality: element.qualitys,
playlist: playlist
});
Lampa.Player.playlist(playlist);
});
scroll.append(card);
});
this.activity.toggle();
};
/* ==================== 3. ALLOHA ANIME 4K / FHD ==================== */
this.searchAlloha = function () {
var _this = this;
var movie = object.movie || {};
var queries = [];
if (movie.kinopoisk_id) queries.push('kp=' + encodeURIComponent(movie.kinopoisk_id));
if (movie.imdb_id) queries.push('imdb=' + encodeURIComponent(movie.imdb_id));
if (movie.id) queries.push('tmdb=' + encodeURIComponent(movie.id));
var title = object.search || movie.title || movie.name || movie.original_title || movie.original_name || '';
var year = ((movie.release_date || movie.first_air_date || '') + '').slice(0, 4);
if (title) queries.push('name=' + encodeURIComponent(title) + (year ? '&year=' + year : ''));
function tryNext(idx) {
if (idx >= queries.length) {
_this.empty('Аниме не найдено в базе Alloha 4K');
return;
}
var url = ALLOHA_API + '?token=' + ALLOHA_TOKEN + '&' + queries[idx];
network.clear();
network.timeout(10000);
network.silent(url, function (json) {
if (json && json.status === 'success' && json.data) {
allohaData = json.data;
allohaIsSerial = Boolean(allohaData.seasons && Object.keys(allohaData.seasons).length);
if (allohaIsSerial) {
allohaSeasons = Object.keys(allohaData.seasons).sort(function (a, b) {
return parseInt(a, 10) - parseInt(b, 10);
});
choice.season = 0;
_this.buildAllohaVoices();
} else {
allohaSeasons = [];
allohaVoices = [];
}
_this.renderAlloha();
} else {
tryNext(idx + 1);
}
}, function () {
tryNext(idx + 1);
});
}
tryNext(0);
};
this.buildAllohaVoices = function () {
allohaVoices = [{ id: 'all', name: 'Все озвучки и субтитры (выбор в плеере)' }];
if (!allohaIsSerial || !allohaSeasons.length) return;
var sKey = allohaSeasons[choice.season] || allohaSeasons[0];
var sObj = allohaData.seasons[sKey];
if (!sObj || !sObj.episodes) return;
var seen = {};
Object.keys(sObj.episodes).forEach(function (epKey) {
var tr = (sObj.episodes[epKey] && sObj.episodes[epKey].translation) || {};
Object.keys(tr).forEach(function (tId) {
if (!seen[tId] && tr[tId] && tr[tId].translation) {
seen[tId] = true;
allohaVoices.push({
id: tId,
name: tr[tId].translation + (tr[tId].uhd ? ' (4K)' : '')
});
}
});
});
};
this.renderAlloha = function () {
this.activity.loader(false);
scroll.clear();
this.updateFilterUI(
allohaSeasons.map(function (s) { return 'Сезон ' + s; }),
allohaVoices.map(function (v) { return v.name; })
);
var items = [];
if (allohaIsSerial && allohaSeasons.length) {
var sKey = allohaSeasons[choice.season] || allohaSeasons[0];
var sObj = allohaData.seasons[sKey];
var epKeys = Object.keys((sObj && sObj.episodes) || {}).sort(function (a, b) {
return parseInt(a, 10) - parseInt(b, 10);
});
var selVoice = allohaVoices[choice.voice] ? allohaVoices[choice.voice].id : 'all';
epKeys.forEach(function (epKey) {
var ep = sObj.episodes[epKey];
var tr = (ep && ep.translation) || {};
if (selVoice !== 'all' && tr[selVoice]) {
var tObj = tr[selVoice];
items.push({
title: 'Серия ' + ep.episode + ' — ' + tObj.translation,
badge: tObj.uhd ? '4K UHD (2160p)' : '1080p FHD',
info: (tObj.quality || allohaData.quality || 'WEB-DL') + ' • База Alloha',
iframe: tObj.iframe
});
} else {
var hasUhd = false;
var names = [];
Object.keys(tr).forEach(function (tId) {
if (tr[tId].uhd) hasUhd = true;
if (tr[tId].translation) names.push(tr[tId].translation);
});
items.push({
title: 'Серия ' + ep.episode,
badge: hasUhd ? '4K UHD (2160p)' : '1080p FHD',
info: names.slice(0, 6).join(', ') + (names.length > 6 ? ' ...' : ''),
iframe: ep.iframe
});
}
});
} else if (allohaData) {
var trMap = allohaData.translation_iframe || {};
var trKeys = Object.keys(trMap);
if (trKeys.length) {
trKeys.forEach(function (tId) {
var tObj = trMap[tId];
items.push({
title: (allohaData.name || 'Аниме') + ' — ' + (tObj.name || 'Озвучка'),
badge: tObj.uhd ? '4K UHD (2160p)' : '1080p FHD',
info: (tObj.quality || allohaData.quality || 'BDRip') + ' • База Alloha',
iframe: tObj.iframe
});
});
} else if (allohaData.iframe) {
items.push({
title: allohaData.name || 'Аниме',
badge: allohaData.uhd ? '4K UHD (2160p)' : '1080p FHD',
info: allohaData.quality || 'BDRip',
iframe: allohaData.iframe
});
}
}
this.appendIframeCards(items);
};
/* ==================== ОБЩИЕ МЕТОДЫ UI ==================== */
this.updateFilterUI = function (seasonNames, voiceNames) {
var select = [];
var chosen = [];
select.push({
title: 'База (Источник)',
subtitle: sources[choice.source].name,
items: sources.map(function (s, i) {
return { title: s.name, selected: i === choice.source, index: i };
}),
stype: 'source'
});
chosen.push(sources[choice.source].id.toUpperCase());
if (seasonNames && seasonNames.length > 1) {
select.push({
title: 'Сезон / Релиз',
subtitle: seasonNames[choice.season] || seasonNames[0],
items: seasonNames.map(function (s, i) {
return { title: s, selected: i === choice.season, index: i };
}),
stype: 'season'
});
if (seasonNames[choice.season]) chosen.push(seasonNames[choice.season]);
}
if (voiceNames && voiceNames.length > 1) {
select.push({
title: 'Озвучка / Субтитры',
subtitle: voiceNames[choice.voice] || voiceNames[0],
items: voiceNames.map(function (v, i) {
return { title: v, selected: i === choice.voice, index: i };
}),
stype: 'voice'
});
if (voiceNames[choice.voice]) chosen.push(voiceNames[choice.voice]);
}
filter.set('filter', select);
filter.chosen('filter', chosen);
};
this.appendIframeCards = function (items) {
var _this = this;
if (!items.length) {
this.empty('Раздачи не найдены. Попробуйте сменить базу в Фильтре.');
return;
}
items.forEach(function (element) {
var card = Lampa.Template.get('anime_hub_item', element);
card.on('hover:enter', function () {
if (!element.iframe) {
Lampa.Noty.show('Ссылка на плеер отсутствует');
return;
}
openIframePlayer(element.iframe, element.title, function () {
_this.activity.toggle();
});
});
scroll.append(card);
});
this.activity.toggle();
};
this.empty = function (msg) {
this.activity.loader(false);
scroll.clear();
this.updateFilterUI([], []);
var empty = new Lampa.Empty({ descr: msg });
scroll.append(empty.render(filter.empty()));
this.start = empty.start;
this.activity.toggle();
};
this.start = function () {
Lampa.Controller.add('content', {
toggle: function () {
Lampa.Controller.collectionSet(scroll.render(), files.render());
Lampa.Controller.collectionFocus(false, scroll.render());
},
up: function () {
if (Navigator.canmove('up')) Navigator.move('up');
else Lampa.Controller.toggle('head');
},
down: function () {
Navigator.move('down');
},
right: function () {
Navigator.move('right');
},
left: function () {
if (Navigator.canmove('left')) Navigator.move('left');
else Lampa.Controller.toggle('menu');
},
back: function () {
Lampa.Activity.backward();
}
});
Lampa.Controller.toggle('content');
};
this.pause = function () {};
this.stop = function () {};
this.render = function () {
return files.render();
};
this.destroy = function () {
$('.anime-hub-iframe-modal').remove();
$(window).off('keydown.anime_hub_modal');
network.clear();
scroll.destroy();
files.destroy();
filter.destroy();
};
}
function initPlugin() {
Lampa.Template.add('anime_hub_item', '<div class="online selector" style="padding: 1.1em 1.4em; margin-bottom: 0.7em; border-radius: 0.5em; background: rgba(255,255,255,0.06); display: flex; justify-content: space-between; align-items: center;">' +
'<div class="online__body" style="padding-right: 1em;">' +
'<div class="online__title" style="font-size: 1.15em; font-weight: 600;">{title}</div>' +
'<div class="online__info" style="opacity: 0.72; margin-top: 0.35em; font-size: 0.92em;">{info}</div>' +
'</div>' +
'<div style="background: rgba(247, 37, 133, 0.22); border: 1px solid rgba(247, 37, 133, 0.55); color: #ff85c0; padding: 0.35em 0.75em; border-radius: 0.35em; font-weight: 700; font-size: 0.9em; white-space: nowrap;">{badge}</div>' +
'</div>');
Lampa.Component.add('anime_hub', AnimeHubComponent);
Lampa.Listener.follow('full', function (e) {
if (e.type === 'complite') {
var btn = $('<div class="full-start__button selector view--online">' +
'<svg viewBox="0 0 24 24" fill="none" width="24" height="24" stroke="currentColor" stroke-width="2" style="margin-right: 0.4em;"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>' +
'<span>Аниме</span>' +
'</div>');
btn.on('hover:enter', function () {
Lampa.Activity.push({
url: '',
title: 'Аниме (AniDUB / AniLibria / Crunchyroll / SUB)',
component: 'anime_hub',
movie: e.data.movie,
page: 1
});
});
e.object.activity.render().find('.view--torrent').after(btn);
}
});
}
if (window.appready) initPlugin();
else {
Lampa.Listener.follow('app', function (e) {
if (e.type === 'ready') initPlugin();
});
}
})();

(function () {
'use strict';
if (window.plugin_lordfilm_4k_ready) return;
window.plugin_lordfilm_4k_ready = true;
var API_URL = 'https://api.apbugall.org/';
var TOKEN = 'ec4acf58bc9bf62f8be18cad95484c';
function openIframePlayer(iframeUrl, title, onClose) {
$('meta[name="referrer"]').attr('content', 'origin');
$('.lordfilm-iframe-modal').remove();
var modal = $('<div class="lordfilm-iframe-modal" style="position:fixed;top:0;left:0;width:100%;height:100%;z-index:99999;background:#000;display:flex;flex-direction:column;">' +
'<div class="lordfilm-iframe-header" style="height:3.2em;background:rgba(15,15,15,0.95);display:flex;align-items:center;justify-content:space-between;padding:0 1.5em;color:#fff;border-bottom:1px solid rgba(255,255,255,0.12);flex-shrink:0;">' +
'<div style="font-size:1.15em;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + (title || 'Lordfilm 4K') + '</div>' +
'<div class="lordfilm-iframe-close selector" style="padding:0.45em 1em;background:rgba(255,255,255,0.14);border-radius:0.4em;cursor:pointer;font-size:0.95em;font-weight:500;">Закрыть (Esc / Назад)</div>' +
'</div>' +
'<div style="flex:1;position:relative;width:100%;height:100%;">' +
'<iframe sandbox="allow-scripts allow-same-origin" referrerpolicy="origin" src="' + iframeUrl + '" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;" allow="autoplay; fullscreen; encrypted-media; picture-in-picture" allowfullscreen></iframe>' +
'</div>' +
'</div>');
function closeModal() {
$(window).off('keydown.lordfilm_modal');
modal.remove();
if (onClose) onClose();
}
modal.find('.lordfilm-iframe-close').on('click hover:enter', function () {
closeModal();
});
$(window).on('keydown.lordfilm_modal', function (e) {
if (e.keyCode === 27 || e.keyCode === 8 || e.keyCode === 461 || e.keyCode === 10009) {
e.preventDefault();
e.stopPropagation();
closeModal();
}
});
$('body').append(modal);
Lampa.Controller.add('lordfilm_iframe', {
toggle: function () {
Lampa.Controller.collectionSet(modal);
Lampa.Controller.collectionFocus(modal.find('.lordfilm-iframe-close')[0], modal);
},
back: function () {
closeModal();
}
});
Lampa.Controller.toggle('lordfilm_iframe');
}
function LordfilmComponent(object) {
var network = new Lampa.Reguest();
var scroll = new Lampa.Scroll({ mask: true, over: true });
var files = new Lampa.Explorer(object);
var filter = new Lampa.Filter(object);
var data = null;
var isSerial = false;
var seasonsList = [];
var voicesList = [];
var choice = {
season: 0,
voice: 0
};
this.create = function () {
var _this = this;
this.activity.loader(true);
this.closeFilter = function () {
if ($('body').hasClass('selectbox--open')) Lampa.Select.close();
};
filter.onSearch = function (value) {
Lampa.Activity.replace({
search: value,
clarification: true
});
};
filter.onSelect = function (type, a, b) {
if (type === 'filter') {
if (a.stype === 'season' && b) {
choice.season = b.index;
choice.voice = 0;
setTimeout(_this.closeFilter, 10);
_this.rebuildVoices();
_this.renderItems();
} else if (a.stype === 'voice' && b) {
choice.voice = b.index;
setTimeout(_this.closeFilter, 10);
_this.renderItems();
}
}
};
filter.onBack = function () {
_this.start();
};
scroll.body().addClass('torrent-list');
files.appendFiles(scroll.render());
files.appendHead(filter.render());
scroll.minus(files.render().find('.explorer__files-head'));
this.search();
return this.render();
};
this.search = function () {
var _this = this;
var movie = object.movie || {};
var queries = [];
if (movie.kinopoisk_id) queries.push('kp=' + encodeURIComponent(movie.kinopoisk_id));
if (movie.imdb_id) queries.push('imdb=' + encodeURIComponent(movie.imdb_id));
if (movie.id) queries.push('tmdb=' + encodeURIComponent(movie.id));
var title = object.search || movie.title || movie.name || movie.original_title || movie.original_name || '';
var year = ((movie.release_date || movie.first_air_date || '') + '').slice(0, 4);
if (title) {
queries.push('name=' + encodeURIComponent(title) + (year ? '&year=' + year : ''));
}
if (!queries.length) {
this.empty('Не удалось определить ID или название фильма');
return;
}
function tryQuery(idx) {
if (idx >= queries.length) {
_this.empty('Фильм не найден в базе Lordfilm 4K (Alloha)');
return;
}
var url = API_URL + '?token=' + TOKEN + '&' + queries[idx];
network.clear();
network.timeout(10000);
network.silent(url, function (json) {
if (json && json.status === 'success' && json.data) {
data = json.data;
_this.prepareData();
} else {
tryQuery(idx + 1);
}
}, function () {
tryQuery(idx + 1);
});
}
tryQuery(0);
};
this.prepareData = function () {
isSerial = Boolean(data.seasons && Object.keys(data.seasons).length);
if (isSerial) {
seasonsList = Object.keys(data.seasons).sort(function (a, b) {
return parseInt(a, 10) - parseInt(b, 10);
});
choice.season = 0;
this.rebuildVoices();
} else {
seasonsList = [];
voicesList = [];
}
this.renderItems();
};
this.rebuildVoices = function () {
voicesList = [{ id: 'all', name: 'Все озвучки (выбор в плеере)' }];
if (!isSerial || !seasonsList.length) return;
var sKey = seasonsList[choice.season] || seasonsList[0];
var seasonObj = data.seasons[sKey];
if (!seasonObj || !seasonObj.episodes) return;
var seen = {};
Object.keys(seasonObj.episodes).forEach(function (epKey) {
var ep = seasonObj.episodes[epKey];
var tr = (ep && ep.translation) || {};
Object.keys(tr).forEach(function (tId) {
if (!seen[tId] && tr[tId] && tr[tId].translation) {
seen[tId] = true;
voicesList.push({
id: tId,
name: tr[tId].translation + (tr[tId].uhd ? ' (4K)' : '')
});
}
});
});
};
this.updateFilter = function () {
var select = [];
var chosen = [];
if (isSerial && seasonsList.length > 1) {
select.push({
title: 'Сезон',
subtitle: 'Сезон ' + seasonsList[choice.season],
items: seasonsList.map(function (s, i) {
return { title: 'Сезон ' + s, selected: i === choice.season, index: i };
}),
stype: 'season'
});
chosen.push('Сезон ' + seasonsList[choice.season]);
}
if (isSerial && voicesList.length > 1) {
select.push({
title: 'Озвучка',
subtitle: voicesList[choice.voice] ? voicesList[choice.voice].name : '',
items: voicesList.map(function (v, i) {
return { title: v.name, selected: i === choice.voice, index: i };
}),
stype: 'voice'
});
if (voicesList[choice.voice]) chosen.push(voicesList[choice.voice].name);
}
filter.set('filter', select);
filter.chosen('filter', chosen);
};
this.renderItems = function () {
var _this = this;
this.activity.loader(false);
scroll.clear();
this.updateFilter();
var items = [];
if (isSerial && seasonsList.length) {
var sKey = seasonsList[choice.season] || seasonsList[0];
var seasonObj = data.seasons[sKey];
var epKeys = Object.keys((seasonObj && seasonObj.episodes) || {}).sort(function (a, b) {
return parseInt(a, 10) - parseInt(b, 10);
});
var selectedVoice = voicesList[choice.voice] ? voicesList[choice.voice].id : 'all';
epKeys.forEach(function (epKey) {
var ep = seasonObj.episodes[epKey];
var tr = (ep && ep.translation) || {};
if (selectedVoice !== 'all' && tr[selectedVoice]) {
var tObj = tr[selectedVoice];
items.push({
title: 'Серия ' + ep.episode + ' — ' + tObj.translation,
badge: tObj.uhd ? '4K UHD (2160p)' : '1080p FHD',
info: (tObj.quality || data.quality || 'WEB-DL') + (tObj.adv ? ' • Есть реклама балансера' : ' • Без вшитой рекламы'),
iframe: tObj.iframe
});
} else {
var hasUhd = false;
var tNames = [];
Object.keys(tr).forEach(function (tId) {
if (tr[tId].uhd) hasUhd = true;
if (tr[tId].translation) tNames.push(tr[tId].translation + (tr[tId].uhd ? ' [4K]' : ''));
});
items.push({
title: 'Серия ' + ep.episode,
badge: hasUhd ? '4K UHD (2160p)' : '1080p FHD',
info: tNames.slice(0, 5).join(', ') + (tNames.length > 5 ? ' ...' : ''),
iframe: ep.iframe
});
}
});
} else if (data) {
var trMap = data.translation_iframe || {};
var trKeys = Object.keys(trMap);
if (trKeys.length) {
trKeys.sort(function (a, b) {
var uA = trMap[a].uhd ? 1 : 0;
var uB = trMap[b].uhd ? 1 : 0;
return uB - uA;
});
trKeys.forEach(function (tId) {
var tObj = trMap[tId];
items.push({
title: (data.name || 'Фильм') + ' — ' + (tObj.name || 'Озвучка'),
badge: tObj.uhd ? '4K UHD (2160p)' : '1080p FHD',
info: (tObj.quality || data.quality || 'BDRip') + (tObj.adv ? ' • Есть вшитая реклама' : ' • Без вшитой рекламы'),
iframe: tObj.iframe
});
});
} else if (data.iframe) {
items.push({
title: data.name || 'Фильм',
badge: data.uhd ? '4K UHD (2160p)' : '1080p FHD',
info: (data.quality || 'BDRip') + (data.translation ? ' • ' + data.translation : ''),
iframe: data.iframe
});
}
}
if (!items.length) {
this.empty('Потоки для этого фильма не найдены');
return;
}
items.forEach(function (element) {
var card = Lampa.Template.get('lordfilm_4k_item', element);
card.on('hover:enter', function () {
if (!element.iframe) {
Lampa.Noty.show('Ссылка на плеер отсутствует');
return;
}
openIframePlayer(element.iframe, element.title, function () {
_this.activity.toggle();
});
});
scroll.append(card);
});
this.activity.toggle();
};
this.empty = function (msg) {
this.activity.loader(false);
scroll.clear();
var empty = new Lampa.Empty({ descr: msg });
scroll.append(empty.render(filter.empty()));
this.start = empty.start;
this.activity.toggle();
};
this.start = function () {
Lampa.Controller.add('content', {
toggle: function () {
Lampa.Controller.collectionSet(scroll.render(), files.render());
Lampa.Controller.collectionFocus(false, scroll.render());
},
up: function () {
if (Navigator.canmove('up')) Navigator.move('up');
else Lampa.Controller.toggle('head');
},
down: function () {
Navigator.move('down');
},
right: function () {
Navigator.move('right');
},
left: function () {
if (Navigator.canmove('left')) Navigator.move('left');
else Lampa.Controller.toggle('menu');
},
back: function () {
Lampa.Activity.backward();
}
});
Lampa.Controller.toggle('content');
};
this.pause = function () {};
this.stop = function () {};
this.render = function () {
return files.render();
};
this.destroy = function () {
$('.lordfilm-iframe-modal').remove();
$(window).off('keydown.lordfilm_modal');
network.clear();
scroll.destroy();
files.destroy();
filter.destroy();
};
}
function initPlugin() {
Lampa.Template.add('lordfilm_4k_item', '<div class="online selector" style="padding: 1.1em 1.4em; margin-bottom: 0.7em; border-radius: 0.5em; background: rgba(255,255,255,0.06); display: flex; justify-content: space-between; align-items: center;">' +
'<div class="online__body" style="padding-right: 1em;">' +
'<div class="online__title" style="font-size: 1.15em; font-weight: 600;">{title}</div>' +
'<div class="online__info" style="opacity: 0.7; margin-top: 0.35em; font-size: 0.92em;">{info}</div>' +
'</div>' +
'<div style="background: rgba(72, 149, 239, 0.22); border: 1px solid rgba(72, 149, 239, 0.55); color: #7cc6fe; padding: 0.35em 0.75em; border-radius: 0.35em; font-weight: 700; font-size: 0.9em; white-space: nowrap;">{badge}</div>' +
'</div>');
Lampa.Component.add('lordfilm_4k', LordfilmComponent);
Lampa.Listener.follow('full', function (e) {
if (e.type === 'complite') {
var btn = $('<div class="full-start__button selector view--online">' +
'<svg viewBox="0 0 24 24" fill="none" width="24" height="24" stroke="currentColor" stroke-width="2" style="margin-right: 0.4em;"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8" fill="currentColor"/></svg>' +
'<span>Lordfilm 4K</span>' +
'</div>');
btn.on('hover:enter', function () {
Lampa.Activity.push({
url: '',
title: 'Lordfilm 4K',
component: 'lordfilm_4k',
movie: e.data.movie,
page: 1
});
});
e.object.activity.render().find('.view--torrent').after(btn);
}
});
}
if (window.appready) initPlugin();
else {
Lampa.Listener.follow('app', function (e) {
if (e.type === 'ready') initPlugin();
});
}
})();
