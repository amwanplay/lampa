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
    'crunchyroll', 'anilibria', 'aniliberty',
    'anidub', 'animedia', 'studio band', 'студийная банда',
    'shiza', 'dream cast', 'jam', 'animevost',
    'anistar', 'onwave', 'ancord', 'subtitles', 'субтитры'
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
    var modal = $(
      '<div class="anime-hub-iframe-modal" style="position:fixed;top:0;left:0;width:100%;height:100%;z-index:99999;background:#000;display:flex;flex-direction:column;">' +
        '<div class="anime-hub-iframe-header" style="height:3.2em;background:rgba(15,15,15,0.95);display:flex;align-items:center;justify-content:space-between;padding:0 1.5em;color:#fff;border-bottom:1px solid rgba(255,255,255,0.12);flex-shrink:0;">' +
          '<div style="font-size:1.15em;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + (title || 'Anime Hub') + '</div>' +
          '<div class="anime-hub-iframe-close selector" style="padding:0.45em 1em;background:rgba(255,255,255,0.14);border-radius:0.4em;cursor:pointer;font-size:0.95em;font-weight:500;">Закрыть (Esc / Назад)</div>' +
        '</div>' +
        '<div style="flex:1;position:relative;width:100%;height:100%;">' +
          '<iframe sandbox="allow-scripts allow-same-origin allow-forms allow-presentation allow-orientation-lock" referrerpolicy="origin" src="' + fullUrl + '" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;" allow="autoplay; fullscreen; encrypted-media; picture-in-picture" allowfullscreen webkitallowfullscreen="true" playsinline="true"></iframe>' +
        '</div>' +
      '</div>'
    );

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
    var network = new Lampa.Request();
    var scroll = new Lampa.Scroll({ mask: true, over: true });
    var files = new Lampa.Explorer(object);
    var filter = new Lampa.Filter(object);

    var sources = [
      { id: 'kodik', name: 'Kodik (AniDUB / AniLibria / Animedia / Crunchyroll / Субтитры)' },
      { id: 'anilibria', name: 'AniLibria Direct (Прямой поток 4K / 1080p без рекламы)' },
      { id: 'alloha', name: 'Alloha Anime (4K UHD / 1080p + Озвучки и Субтитры)' }
    ];

    var choice = { source: 0, season: 0, voice: 0 };
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
        Lampa.Activity.replace({ search: value, clarification: true });
      };

      filter.onSelect = function (type, a, b) {
        if (type === 'filter') {
          if (a.type === 'source' && b) {
            choice.source = b.index;
            choice.season = 0;
            choice.voice = 0;
            setTimeout(_this.closeFilter, 10);
            _this.loadSource();
          } else if (a.type === 'season' && b) {
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
          } else if (a.type === 'voice' && b) {
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
              if (gTitle.indexOf('TB') === -1 && gTitle.indexOf('сезон') === -1 && sNum !== '0' && sNum !== '1') {
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
      this.activity.loader(false);
      scroll.clear();

      var grp = kodikGroups[choice.season] || kodikGroups[0];
      if (!grp) {
        this.empty('Нет доступных раздач Kodik');
        return;
      }

      var tr = grp.translations[choice.voice] || grp.translations[0];

      this.updateFilterUI(
        kodikGroups.map(function (g) {
          return g.title + (g.year ? ' (' + g.year + ')' : '');
        }),
        kodikVoices.map(function (v) {
          return v.name;
        })
      );

      var items = [];

      if (tr && tr.episodes && Object.keys(tr.episodes).length) {
        var epNums = Object.keys(tr.episodes).sort(function (a, b) {
          return parseInt(a, 10) - parseInt(b, 10);
        });

        epNums.forEach(function (epNum) {
          var epLink = fixProto(tr.episodes[epNum]);
          items.push({
            title: 'Серия ' + epNum + ' - ' + tr.name,
            badge: tr.type === 'subtitles' ? 'SUB (Оригинал + Субтитры)' : (tr.quality || 'HD'),
            info: grp.title + ' • Смена озвучки (AniDUB, Anilibria, Crunchyroll, Субтитры) прямо в углу плеера',
            iframe: epLink || grp.mainLink
          });
        });
      } else if (grp.translations.length) {
        grp.translations.forEach(function (t) {
          items.push({
            title: grp.title + ' - ' + t.name,
            badge: t.type === 'subtitles' ? 'SUB (Субтитры)' : (t.quality || 'HD'),
            info: 'Полнометражное аниме • Перевод: ' + t.name,
            iframe: t.link
          });
        });
      }

      this.appendIframeCards(items);
    };

    /* ==================== 2. ANILIBRIA DIRECT 4K / 1080p ==================== */
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
      this.activity.loader(false);
      scroll.clear();

      this.updateFilterUI(
        libriaReleases.map(function (r) {
          var nm = (r.name && (r.name.main || r.name.english)) || 'Релиз';
          return nm + (r.year ? ' (' + r.year + ')' : '');
        }),
        ['AniLibria.TV (Прямой поток 4K / 1080p)']
      );

      var eps = (libriaCurrent && libriaCurrent.episodes) || [];
      var relTitle = (libriaCurrent && libriaCurrent.name && libriaCurrent.name.main) || 'AniLibria';

      var playItems = eps.map(function (ep) {
        var qMap = {};
        if (ep.hls_2160) qMap['2160p'] = ep.hls_2160;
        if (ep.hls_1080) qMap['1080p'] = ep.hls_1080;
        if (ep.hls_720) qMap['720p'] = ep.hls_720;
        if (ep.hls_480) qMap['480p'] = ep.hls_480;
        var best = ep.hls_2160 || ep.hls_1080 || ep.hls_720 || ep.hls_480 || '';
        var badgeLabel = ep.hls_2160
          ? '4K UHD (Прямой)'
          : (ep.hls_1080 ? '1080p FHD (Прямой)' : '720p HD');

        return {
          title: 'Серия ' + ep.ordinal + (ep.name ? ' - ' + ep.name : ''),
          badge: badgeLabel,
          info: relTitle + ' • Родной плеер Lampa без рекламы',
          file: best,
          qualitys: qMap
        };
      });

      var playlist = playItems.map(function (it) {
        return {
          title: it.title,
          url: it.file,
          quality: it.qualitys
        };
      });

      playItems.forEach(function (element) {
        var card = Lampa.Template.get('anime_hub_item', element);
        card.on('hover:enter', function () {
          if (!element.file) {
            Lampa.Noty.show('Поток отсутствует');
            return;
          }
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
            _this.prepareAlloha();
          } else {
            tryNext(idx + 1);
          }
        }, function () {
          tryNext(idx + 1);
        });
      }

      tryNext(0);
    };

    this.prepareAlloha = function () {
      var d = allohaData || {};
      allohaIsSerial = !!(d.seasons && Object.keys(d.seasons).length);
      allohaSeasons = [];

      if (allohaIsSerial) {
        Object.keys(d.seasons).forEach(function (sNum) {
          allohaSeasons.push({
            num: sNum,
            title: 'Сезон ' + sNum,
            data: d.seasons[sNum]
          });
        });
        allohaSeasons.sort(function (a, b) {
          return parseInt(a.num, 10) - parseInt(b.num, 10);
        });
      } else {
        allohaSeasons.push({
          num: '0',
          title: 'Фильм / Спешл',
          data: d
        });
      }

      choice.season = 0;
      choice.voice = 0;
      this.buildAllohaVoices();
      this.renderAlloha();
    };

    this.buildAllohaVoices = function () {
      allohaVoices = [];
      var seasonObj = allohaSeasons[choice.season] || allohaSeasons[0];
      if (!seasonObj) return;

      var sData = seasonObj.data || {};
      var translationObj = sData.translation || sData.translations || {};

      if (typeof translationObj === 'object' && !Array.isArray(translationObj)) {
        Object.keys(translationObj).forEach(function (vKey) {
          var item = translationObj[vKey];
          var vName = typeof item === 'string' ? item : (item.name || item.title || vKey);
          allohaVoices.push({ key: vKey, name: vName, raw: item });
        });
      } else if (Array.isArray(translationObj)) {
        translationObj.forEach(function (item, idx) {
          var vName = typeof item === 'string' ? item : (item.name || item.title || ('Озвучка ' + (idx + 1)));
          allohaVoices.push({ key: idx, name: vName, raw: item });
        });
      }
    };

    this.renderAlloha = function () {
      this.activity.loader(false);
      scroll.clear();

      var seasonObj = allohaSeasons[choice.season] || allohaSeasons[0];
      if (!seasonObj) {
        this.empty('Раздел Alloha не содержит доступных данных');
        return;
      }

      this.updateFilterUI(
        allohaSeasons.map(function (s) { return s.title; }),
        allohaVoices.length ? allohaVoices.map(function (v) { return v.name; }) : ['Стандартный перевод']
      );

      var items = [];
      var sData = seasonObj.data || {};
      var selVoice = allohaVoices[choice.voice];
      var iframeUrl = sData.iframe || sData.link || (allohaData && (allohaData.iframe || allohaData.link)) || '';

      if (selVoice) {
        if (typeof selVoice.raw === 'object' && selVoice.raw.iframe) {
          iframeUrl = selVoice.raw.iframe;
        } else if (typeof selVoice.raw === 'object' && selVoice.raw.episodes) {
          var eps = selVoice.raw.episodes;
          Object.keys(eps).forEach(function (epNum) {
            var epData = eps[epNum];
            var epIframe = typeof epData === 'string' ? epData : (epData.iframe || epData.link || iframeUrl);
            items.push({
              title: 'Серия ' + epNum + ' - ' + selVoice.name,
              badge: '4K / 1080p (Alloha)',
              info: 'Высочайшее качество • Озвучка: ' + selVoice.name,
              iframe: epIframe
            });
          });
        }
      }

      if (!items.length && iframeUrl) {
        items.push({
          title: seasonObj.title + (selVoice ? ' (' + selVoice.name + ')' : ''),
          badge: '4K / 1080p (Alloha)',
          info: 'Онлайн плеер Alloha Anime с выбором качества и серий',
          iframe: iframeUrl
        });
      }

      if (!items.length) {
        this.empty('Плеер Alloha недоступен для выбранной озвучки');
        return;
      }

      this.appendIframeCards(items);
    };

    /* ==================== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ==================== */
    this.updateFilterUI = function (seasonsList, voicesList) {
      filter.set('filter', [
        {
          title: 'Источник',
          stype: 'source',
          value: sources[choice.source].name,
          items: sources.map(function (s, i) {
            return { title: s.name, index: i, selected: i === choice.source };
          })
        },
        {
          title: 'Сезон / Тайтл',
          stype: 'season',
          value: seasonsList[choice.season] || seasonsList[0] || 'Сезон 1',
          items: seasonsList.map(function (st, i) {
            return { title: st, index: i, selected: i === choice.season };
          })
        },
        {
          title: 'Озвучка / Перевод',
          stype: 'voice',
          value: voicesList[choice.voice] || voicesList[0] || 'По умолчанию',
          items: voicesList.map(function (vt, i) {
            return { title: vt, index: i, selected: i === choice.voice };
          })
        }
      ]);
    };

    this.appendIframeCards = function (items) {
      items.forEach(function (element) {
        var card = Lampa.Template.get('anime_hub_item', element);
        card.on('hover:enter', function () {
          if (!element.iframe) {
            Lampa.Noty.show('Ссылка на плеер отсутствует');
            return;
          }
          openIframePlayer(element.iframe, element.title);
        });
        scroll.append(card);
      });
      this.activity.toggle();
    };

    this.empty = function (msg) {
      this.activity.loader(false);
      scroll.clear();
      var emptyDiv = $('<div class="empty empty--grid"><div class="empty__title">' + (msg || 'Ничего не найдено') + '</div></div>');
      scroll.append(emptyDiv);
      this.activity.toggle();
    };

    this.start = function () {
      Lampa.Controller.add('content', {
        toggle: function () {
          scroll.render().find('.anime_hub_item').first().focus();
        },
        back: function () {
          Lampa.Activity.backward();
        }
      });
      Lampa.Controller.toggle('content');
    };

    this.pause = function () {};
    this.stop = function () {};
    this.destroy = function () {
      network.clear();
      scroll.destroy();
    };
  }

  function initAnimeHub() {
    Lampa.Template.add(
      'anime_hub_item',
      '<div class="anime_hub_item selector layer--render layer--width"><div class="anime_hub_item__body"><div class="anime_hub_item__title">{title}</div><div class="anime_hub_item__info">{info}</div></div><div class="anime_hub_item__badge">{badge}</div></div>'
    );
    Lampa.Component.add('anime_hub', AnimeHubComponent);

    Lampa.Listener.follow('full', function (e) {
      if (e.type === 'complite') {
        var isAnime = false;
        var renderData = e.data || {};
        var movie = renderData.movie || {};

        if (movie.genres && Array.isArray(movie.genres)) {
          isAnime = movie.genres.some(function (g) {
            var gName = (g.name || '').toLowerCase();
            return gName.indexOf('аниме') !== -1 || gName.indexOf('anime') !== -1;
          });
        }

        if (!isAnime && (movie.title || movie.name || movie.original_title)) {
          var fullText = ((movie.title || '') + ' ' + (movie.name || '') + ' ' + (movie.original_title || '')).toLowerCase();
          if (fullText.indexOf('аниме') !== -1 || fullText.indexOf('anime') !== -1) {
            isAnime = true;
          }
        }

        if (isAnime) {
          var button = $(
            '<div class="full-start__button selector button--anime-hub" style="background: linear-gradient(135deg, #ff0055 0%, #ff5500 100%); color: #fff; font-weight: bold;">' +
              '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" style="margin-right:8px;vertical-align:middle;">' +
                '<path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
                '<path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
                '<path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
              '</svg>' +
              '<span>Anime Hub (Kodik / AniLibria / Alloha)</span>' +
            '</div>'
          );
          button.on('hover:enter', function () {
            Lampa.Activity.push({
              url: '',
              title: 'Anime Hub',
              component: 'anime_hub',
              movie: movie,
              page: 1
            });
          });
          e.object.activity.render().find('.full-start__buttons').append(button);
        }
      }
    });
  }

  function loadLordfilm4K() {
    if (window.lordfilm_4k_plugin_loaded) return;
    window.lordfilm_4k_plugin_loaded = true;
    var script = document.createElement('script');
    script.src = 'https://amwanplay.github.io/lampa/lordfilm_4k.js';
    script.onerror = function () {
      console.warn('Lordfilm 4K module is unavailable on the server (404)');
    };
    document.head.appendChild(script);
  }

  if (window.appready) {
    initAnimeHub();
    loadLordfilm4K();
  } else {
    Lampa.Listener.follow('app', function (e) {
      if (e.type === 'ready') {
        initAnimeHub();
        loadLordfilm4K();
      }
    });
  }
})();