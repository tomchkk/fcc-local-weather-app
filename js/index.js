$(document).ready(function() {
	fetchWeather();
	$("#temp-unit a").on("click", function() {
		convertTempValue($(this));
	});
});

// main api call
function fetchWeather() {
	// first api to get ip coordinates
	$.getJSON('http://ipinfo.io', function(ipData) {
		var ipCoords = ipData.loc.split(",");

		// second api to get weather data
		var endPoint = "http://api.openweathermap.org/data/2.5/weather";
		var queryCoords = "?lat=" + ipCoords[0] + "&lon=" + ipCoords[1];
		var queryUnits = "&units=metric"; // units query should remain hardcoded, since it influences a number of returned values
		var queryAppId = "&APPID=52baa3f44e6cab775ad1c1a1e6da3a11";
		var openWeatherApi = endPoint + queryCoords + queryUnits + queryAppId;
		$.getJSON(openWeatherApi, function(weatherJson) {
			// console.log(weatherJson);
			extractWeatherData(weatherJson);
		}).fail(function(jqXHR, textStatus, errorThrown) {
			console.log("API call to openweathermap.org failed. Error: '%s'", errorThrown);
			updateDescription("[Weather data could not be retrieved at this time.]");
		});

	}).fail(function(jqXHR, textStatus, errorThrown) {
		console.log("API call to ipinfo.io failed. Error: '%s'", errorThrown);
		updateDescription("[Your location could not be determined.]");
	});
};

// data extraction and upate
function extractWeatherData(json) {
	updateLocation(json.name);
	updateIcon(json.weather[0].icon);
	updateTemperature(json.main.temp);
	updateDescription(json.weather[0].description);
	updateWind(json.wind.speed);
	updatePrecipitation(json.rain, json.snow);
}

function updateLocation(loc) {
	$("#location h3 span").html(loc);
}

function updateIcon(conditions) {
	var outlook = "sunny";
	// conditions are 3 characters, only need to check the first two:
	switch (conditions.slice(0, 2)) {
		case '01': // clear sky
			outlook = "sunny";
			break;
		case '02': // few clouds
			outlook = "few-clouds";
			break;
		case '03': // scattered clouds
		case '04': // broken clouds
			outlook = "cloudy";
			break;
		case '09': // shower rain
			outlook = "rainy";
			break;
		case '10': // rain
			outlook = "sun-shower";
			break;
		case '11': // thunderstorm
			outlook = "thunder-storm"
			break;
		case '13': // snow
			outlook = "flurries"
			break;
		case '50': // mist
			outlook = "mist"
			break;
		default:
			console.log("There is no icon for weather condition code '%s'.", conditions);
	}

	$("#weather-icons .icon").addClass("hidden"); // ensure all icon elements are hidden
	$("#weather-icons ." + outlook).removeClass("hidden");
}

function updateTemperature(temp_celcius) {
	var temp = temp_celcius;
	if ("celcius" != getActiveTempUnits()) {
		temp = convertCelToFah(temp_celcius);
	}
	// update html content, using active temperature unit
	$("#temp-value span").html(Math.round(temp));
	// update the color scheme based on the (default) celcius value
	applyColorScheme(Math.round(temp_celcius));
}

function updateDescription(description) {
	$("#description p").html(sentenceCase(description));
}

function updateWind(windSpeed) {
	$("#wind span").html(windSpeed + " " + encapsulate("m/s", "small"));
}

function updatePrecipitation(rain, snow) {
	var precipitation = "0.00"; // default
	var rain_value = getObjectFirstKeyValue(rain);
	if (rain_value) {
		precipitation = rain_value;
	}
	var snow_value = getObjectFirstKeyValue(snow);
	if (snow_value) {
		// any snow value should overwrite a rain value
		precipitation = snow_value;
	}
	$("#precipitation span").html(precipitation + " " + encapsulate("mm", "small"));
}

// convert temperature value
function convertTempValue(tempUnitSelector) {
	var tempValSelector = $("#temp-value span");

	if ($("#celcius", tempUnitSelector).hasClass("active")) {
		tempValSelector.html(convertCelToFah(tempValSelector.html()));
		toggleClass("active", $("#celcius", tempUnitSelector), $("#fahrenheit", tempUnitSelector));
		return;
	}

	if ($("#fahrenheit", tempUnitSelector).hasClass("active")) {
		tempValSelector.html(convertFahToCel(tempValSelector.html()));
		toggleClass("active", $("#fahrenheit", tempUnitSelector), $("#celcius", tempUnitSelector));
		return;
	}
};

// helper functions
function applyColorScheme(celcius) {
	var tempClass = "mild";
	switch (true) {
		case (celcius >= 30):
			tempClass = "hot";
			break;
		case (celcius >= 20):
			tempClass = "warm";
			break;
		case (celcius >= 10):
			tempClass = "mild";
			break;
		case (celcius >= 1):
			tempClass = "cold";
			break;
		case (celcius <= 0):
			tempClass = "freezing";
			break;
	}
	$("#overlay").removeClass();
	$("#overlay").addClass(tempClass);
}

function convertCelToFah(celcius) {
	return Math.round(((celcius * 9) / 5) + 32);
}

function convertFahToCel(fahrenheit) {
	return Math.round(((fahrenheit - 32) * 5) / 9);
}

function encapsulate(content, tag) {
	return "<" + tag + ">" + content + "</" + tag + ">";
}

function getActiveTempUnits() {
	return $("#temp-unit a span.active").attr('id');
}

function getObjectFirstKeyValue(object) {
	if (object) {
		return object[Object.keys(object)[0]];
	}
	return false;
}

function sentenceCase(str) {
	return str.replace(/(^\w{1})/gi, function(toReplace) {
		return toReplace.toUpperCase();
	});
}

function toggleClass(className, fromElement, toElement) {
	fromElement.removeClass(className);
	toElement.addClass(className);
}