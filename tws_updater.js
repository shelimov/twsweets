// ==UserScript==
// @name The-West Sweets Loader
// @namespace TWS
// @date 1 September, 2014.
// @description The West Sweets script loader. No need to be updated. 
// @author Shelimov
// @version 1.0.0.0
// @include http://*.the-west.*/game.php*
// @include http://*.beta.the-west.*
// ==/UserScript==	
(function(s, settings) {
	var	lang = tws_settings && tws_settings.common && tws_settings.common.lang || 'en',
		version = tws_settings && tws_settings.common && tws_settings.common.version || 'last';

	s.src = 'http://tws.shelimov.me/' + version + '/' + lang;
	document.head.appendChild(s);
})(document.createElement('script'), JSON.parse(localStorage.getItem('TWSweets'));