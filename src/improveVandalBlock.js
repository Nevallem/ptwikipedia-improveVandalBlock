/**
 * @author [[w:pt:User:!Silent]]
 * @date 13/feb/2017
 * @update 13/nov/2019
 */
/* jshint laxbreak:true, expr:true */
/* global $, mw */

( function() {
'use strict';

mw.messages.set( {
	'ivb-buttonName-0': 'vandalismo',
	'ivb-buttonName-1': 'tentativa',
	'ivb-blocking': 'Bloqueando o vândalo...',
	'ivb-reason-0': 'Vandalismo [[Wikipédia:Vandalismo|contumaz]]',
	'ivb-reason-1': 'Tentativa de [[WP:VAN|vandalismo]] frustrada por [[WP:FE|filtro]]',
	'ivb-reason-page': ' na página [[$1]]',
	'ivb-notifying': 'Notificando o vândalo...',
	'ivb-sectionTitle': 'Notificação de bloqueio',
	'ivb-duration': 'um dia',
	'ivb-summary': 'Notificação de bloqueio usando um [[User:!Silent/improveVandalBlock.js|script]]',
	'ivb-success': 'O usuário "$1" foi bloqueado e notificado com sucesso.'
} );

var ivb = {
	alreadyBlocked: false
};

ivb.message = function ( /*name[, $1[, $2[, ... ]]]*/ ) {
	return mw.message.apply( this, arguments ).plain();
};


ivb.automatizeCheckOptions = function () {
	if ( mw.util.isIPAddress( $( 'input[name="wpTarget"]' ).val() ) ) {
		$( 'input[name="wpDisableEmail"]' ).prop( 'checked', true );
		$( 'input[name="wpDisableUTEdit"]' ).prop( 'checked', true );
	}
};

ivb.instablock = function () {
	var blockType, $placement,
		type = !!mw.util.getParamValue( 'diff' ) ? 0 : 1,
		userNameBlocked = $( '#ooui-php-1' ).val() || $( '.mw-userlink bdi' ).eq( type ? 0 : 1 ).text() || window.decodeURI( mw.util.getUrl().split( '/' )[ 3 ] || mw.util.getParamValue( 'target' ) );

	if ( !mw.util.isIPAddress( userNameBlocked ) )
		return;

	if ( !!$( '.mw-abuselog-details' ).length ) {
		$placement = $( '.mw-usertoollinks a:last' );
	} else if ( !!mw.util.getParamValue( 'diff' ) ) {
		$placement = $( '#mw-diff-ntitle2 .mw-usertoollinks a:last' );
	} else {
		$placement = $( '#contentSub a' ).eq( mw.util.isIPAddress( userNameBlocked ) ? 1 : 2 );
	}

	$placement.after( ' [<a class="ivb-instablock" style="cursor: pointer;" type="' + type + '">' + ivb.message( 'ivb-buttonName-' + type ) + '</a> | <a class="ivb-instablock" style="cursor: pointer;" type="' + ( +!type ) + '">' + ivb.message( 'ivb-buttonName-' + ( +!type ) ) + '</a>]' );

	$( '.ivb-instablock' ).click( function() {
		if ( ivb.alreadyBlocked ) {
			return;
		}

		ivb.alreadyBlocked = true;
		blockType = $( this ).attr( 'type' );
		mw.notify( ivb.message( 'ivb-blocking' ) );

		$.post( mw.util.wikiScript( 'api' ), {
			action: 'block',
			user: userNameBlocked,
			token: mw.user.tokens.get( 'csrfToken' ),
			expiry: '1 day',
			reason: ivb.message( 'ivb-reason-' + blockType ),
			autoblock: 1,
			noemail: $.inArray( 'rollbacker', mw.config.get( 'wgUserGroups' ) ) === -1 ? 1 : undefined,
			nocreate: 1
		} ).done( function() {
			mw.notify( ivb.message( 'ivb-notifying' ) );

			( new mw.Api() ).editPage( {
				title: 'User talk:' + userNameBlocked,
				section: 'new',
				watchlist: 'preferences',
				sectiontitle: ivb.message( 'ivb-sectionTitle' ),
				text: '\{\{subst:Bloqueado|1=' + ivb.message( 'ivb-duration' ) + '|2=' + ivb.message( 'ivb-reason-' + blockType ) + ( !!mw.util.getParamValue( 'diff' )
					? ivb.message( 'ivb-reason-page', mw.config.get( 'wgPageName' ).replace( /_/g, ' ' ) )
					: ''
				) + '.\}\} \~\~\~\~',
				summary: ivb.message( 'ivb-summary' ),
				done: function() {
					mw.notify( ivb.message( 'ivb-success', userNameBlocked ) );
				}
			} );
		} );
	} );
};

if ( mw.config.get( 'wgCanonicalSpecialPageName' ) === 'Block' && !$( '.error' ).length ) {
	$( ivb.automatizeCheckOptions );
}

if ( !!$( '.mw-abuselog-details' ).length || !!mw.util.getParamValue( 'diff' ) || mw.config.get( 'wgCanonicalSpecialPageName' ) === 'Contributions' ) {
	$( ivb.instablock );
}

}() );
