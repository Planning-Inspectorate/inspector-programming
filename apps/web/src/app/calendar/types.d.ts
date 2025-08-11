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
