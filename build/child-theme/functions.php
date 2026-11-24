<?php
/**
 * Reading Teacher Online – Hello Elementor child theme.
 *
 * @package hello-elementor-child
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'RTO_CHILD_VERSION', '1.0.0' );

/**
 * Styles and scripts.
 */
add_action(
	'wp_enqueue_scripts',
	function () {
		wp_enqueue_style( 'hello-elementor-parent-style', get_template_directory_uri() . '/style.css', array(), wp_get_theme( 'hello-elementor' )->get( 'Version' ) );
		wp_enqueue_style(
			'rto-child-style',
			get_stylesheet_uri(),
			array( 'hello-elementor-parent-style' ),
			RTO_CHILD_VERSION . '-' . filemtime( get_stylesheet_directory() . '/style.css' )
		);

		wp_enqueue_script(
			'rto-site',
			get_stylesheet_directory_uri() . '/assets/rto.js',
			array(),
			RTO_CHILD_VERSION . '-' . filemtime( get_stylesheet_directory() . '/assets/rto.js' ),
			array(
				'in_footer' => true,
				'strategy'  => 'defer',
			)
		);

		$owl = get_posts(
			array(
				'post_type'      => 'attachment',
				'name'           => 'illus-owl',
				'posts_per_page' => 1,
				'fields'         => 'ids',
			)
		);

		wp_localize_script(
			'rto-site',
			'rtoConfig',
			array(
				'owl'  => $owl ? wp_get_attachment_image_url( $owl[0], 'full' ) : '',
				'tips' => array(
					array( 't' => "Hoot hoot! Hi, I'm Ollie. Want a free phonics guide? No email needed!", 'c' => 'Get the free guide →', 'h' => '#services' ),
					array( 't' => 'Did you know? 15–20 minutes of happy reading a day works better than long sessions.', 'c' => 'More reading tips →', 'h' => '#blog' ),
					array( 't' => 'Reading builds independence. Every little step counts!', 'c' => 'See how Marilyn helps →', 'h' => '#services' ),
					array( 't' => 'Not sure where to begin? Ask Marilyn for a FREE email consultation.', 'c' => 'Ask Marilyn →', 'h' => '#contact' ),
				),
			)
		);
	},
	20
);

/**
 * The first hero slide image is the homepage LCP image: load it eagerly with high priority
 * (matched by its media-library slug) instead of lazy-loading it.
 */
add_filter(
	'wp_get_attachment_image_attributes',
	function ( $attr, $attachment ) {
		if ( $attachment && 'reading-hero-1-pexels-8317829' === $attachment->post_name ) {
			$attr['loading']       = 'eager';
			$attr['fetchpriority'] = 'high';
			$attr['decoding']      = 'async';
		}
		return $attr;
	},
	20,
	2
);
