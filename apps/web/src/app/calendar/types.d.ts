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

export interface BookedEventTimeslot {
	startTime: Date;
	endTime: Date;
}
