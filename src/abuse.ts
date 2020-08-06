// @flow
import { post, XcapJsonResult, Thunk } from './api';

/**
 * Component name
 */
export const COMPONENT_NAME: string = 'abuse';

export const TYPE_ABUSE: string = 'net.josh.community.abuse.ReferencedAbuse';

/**
 * Send an abuse report for an object.
 *
 * Only authorized users may create abuse reports
 *
 * @param obfuscatedReference {String}
 * @param abuseText {String}
 * @param componentName Optional component name used for config (for example "like")
 * @param context Optional community context used for config (for example "forum")
 */
export function report({
	obfuscatedReference,
	abuseText,
	context = null,
	componentName = null
}: {
	obfuscatedReference: string,
	abuseText: string,
	context?: string | null,
	componentName?: string | null
}): Thunk<XcapJsonResult> {
	return post({
		url: '/abuse/report',
		parameters: arguments,
		context: context || 'abuse',
		componentName: componentName || COMPONENT_NAME
	});
}
