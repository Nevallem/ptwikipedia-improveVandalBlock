/**
 * Add buttons to instablock vandals
 *
 * @author [[w:pt:User:!Silent]]
 * @date 13/feb/2017
 * @update 06/jun/2021
 */
/* jshint laxbreak: true, expr: true, esversion: 6 */
/* global $, mw */

( function() {
'use strict';

let ibv;

// Messages set
mw.messages.set( {
	'ibv-buttonName-0': 'tentativa',
	'ibv-buttonName-1': 'vandalismo',
	'ibv-blocking': 'Bloqueando o vândalo...',
	'ibv-reason-0': 'Tentativa de [[WP:VAN|vandalismo]] frustrada por [[WP:FE|filtro]]',
	'ibv-reason-1': 'Vandalismo [[Wikipédia:Vandalismo|contumaz]]',
	'ibv-reason-page': ' na página [[$1]]',
	'ibv-notifying': 'Notificando o vândalo...',
	'ibv-sectionTitle': 'Notificação de bloqueio',
	'ibv-duration-IP': 'um dia',
	'ibv-duration-user': 'infinito',
	'ibv-summary': 'Notificação de bloqueio usando um [[User:!Silent/instablockVandal.js|script]]',
	'ibv-success': 'O usuário "$1" foi bloqueado e notificado com sucesso.'
} );

/**
 * @class InstablockVandal
 */
class InstablockVandal {
	constructor() {
		this.already_blocked = false;
		this.username_target = '';
		this.placement_type = 0;
		this.is_abuselog_details = !!$( '.mw-abuselog-details' ).length;
		this.is_page_diff = !!mw.util.getParamValue( 'diff' );
	}

	/**
	 * Messages
	 * @param {string} name Name of the message
	 * @param {string|number} [$N] Dynamic parameters to the message (i.e. the values for $1, $2, etc)
	 * @see [[mw:ResourceLoader/Default_modules#mediaWiki.message]]
	 * @return {string}
	 */
	message( /*name[, $1[, $2[, ... ]]]*/ ) {
		return mw.message.apply( this, arguments ).plain();
	}

	/**
	 * Add the new buttons
	 */
	attach_buttons() {
		let $placement;

		ibv.placement_type = ibv.is_page_diff ? 0 : 1;
		ibv.username_target = $( '#ooui-php-1' ).val()
			|| $( '.mw-userlink bdi' ).eq( ibv.placement_type ? 0 : 1 ).text()
			|| window.decodeURI( mw.util.getUrl().split( '/' )[ 3 ]
			|| mw.util.getParamValue( 'target' ) );

		if ( ibv.is_abuselog_details )
			$placement = $( '.mw-usertoollinks a:last' );
		else if ( !ibv.placement_type )
			$placement = $( '#mw-diff-ntitle2 .mw-usertoollinks a:last' );
		else
			$placement = $( '#contentSub a' ).eq( mw.util.isIPAddress( ibv.username_target ) ? 1 : 2 );

		$placement.after(
			` [<a class="ibv-instablock" style="cursor: pointer;" type="0">${ ibv.message( 'ibv-buttonName-0' ) }</a> | `
			+ `<a class="ibv-instablock" style="cursor: pointer;" type="1"> ${ ibv.message( 'ibv-buttonName-1' ) }</a>]`
		);

		$( '.ibv-instablock' ).click( ibv.instablock );
	}

	/**
	 * Executes the instablock
	 */
	instablock() {
		let blockType, vandalismPage;

		if ( ibv.already_blocked )
			return;

		ibv.already_blocked = true;
		blockType = $( this ).attr( 'type' );
		mw.notify( ibv.message( 'ibv-blocking' ) );

		if ( ibv.is_page_diff )
			vandalismPage =	mw.config.get( 'wgPageName' ).replace( /_/g, ' ' );
		else if ( ibv.is_abuselog_details )
			vandalismPage = $( '#mw-content-text' ).find( 'a' ).eq( 7 ).html();
		else
			vandalismPage = null;

		$.post( mw.util.wikiScript( 'api' ), {
			action: 'block',
			user: ibv.username_target,
			token: mw.user.tokens.get( 'csrfToken' ),
			expiry: ( mw.util.isIPAddress( ibv.username_target ) ? '1 day' : 'infinity' ),
			reason: ibv.message( `ibv-reason-${ blockType }` ),
			autoblock: 1,
			noemail: $.inArray( 'rollbacker', mw.config.get( 'wgUserGroups' ) ) === -1 ? 1 : undefined,
			nocreate: 1
		} ).done( function() {
			mw.notify( ibv.message( 'ibv-notifying' ) );

			( new mw.Api() ).editPage( {
				title: 'User talk:' + ibv.username_target,
				section: 'new',
				watchlist: 'preferences',
				sectiontitle: ibv.message( 'ibv-sectionTitle' ),
				text: `\{\{subst:Bloqueado|1=${ ibv.message( `ibv-duration-${ mw.util.isIPAddress( ibv.username_target ) ? 'IP' : 'user' }` ) }|2=${ ibv.message( `ibv-reason-${ blockType }` ) + (
					vandalismPage
						? ibv.message( 'ibv-reason-page', vandalismPage )
						: ''
					) }.\}\} \~\~\~\~`,
				summary: ibv.message( 'ibv-summary' ),
				done: function() {
					mw.notify( ibv.message( 'ibv-success', ibv.username_target ) );
				}
			} );
		} );
	}
}

/**
 * @object ibv
 */
ibv = new InstablockVandal();

if ( mw.config.get( 'wgCanonicalSpecialPageName' ) === 'Block' && !$( '.error' ).length ) {
	$( 'input[name="wpDisableEmail"]' ).prop( 'checked', true );
	$( 'input[name="wpDisableUTEdit"]' ).prop( 'checked', true );
}

if ( !!$( '.mw-abuselog-details' ).length
	|| ibv.is_page_diff
	|| mw.config.get( 'wgCanonicalSpecialPageName' ) === 'Contributions'
)
	$( ibv.attach_buttons );
}() );
