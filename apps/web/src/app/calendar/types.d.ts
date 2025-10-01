export interface Event {
	subject: string;
	startDateTime: string;
	endDateTime: string;
	status: string;
	location: string;
	address: string;
}

export interface CalendarEntry {
	text: string;
	isEvent: boolean;
	isToday: boolean;
	status: string;
	location: string;
	address: string;
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
