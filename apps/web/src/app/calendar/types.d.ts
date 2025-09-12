export interface Event {
	subject: string;
	startDateTime: string;
	endDateTime: string;
}

export interface CalendarEntry {
	text: string;
	isEvent: boolean;
	isToday: boolean;
}

export interface CalendarEventInput {
	subject: string;
	start: {
		dateTime: string;
		timeZone: string;
	};
	end: {
		dateTime: string;
		timeZone: string;
	};
	location: {
		address: {
			street: string;
			postalCode: string;
		};
	};
	extensions: [
		{
			'@odata.type': string;
			extensionName: string;
			caseReference?: string;
			eventType?: string;
		}
	];
}
