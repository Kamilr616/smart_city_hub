/*
 * wlan_mwm.c
 *
 *  Created on: 19 lut 2022
 *      Author: daniel
 */
#include "wlan_mwm.h"

/*******************************************************************************
 * Variables
 ******************************************************************************/

static mwm_sockaddr_t g_http_srv_addr = {.host = "192.168.1.109", .port = 80};
static mwm_wlan_t g_wlans[MAX_WLAN_SCAN];
static char g_buffer[MWM_BUFFER_LEN];

/*******************************************************************************
 * Code
 ******************************************************************************/

int wlan_get_state() {

	int ret = mwm_wlan_status();
	if (ret < 0)
	{
		PRINTF("Failed to get WLAN status, error: %d\r\n", ret);
		while (1)
			;
	}

	return ret;
}

void wlan_state() {

	PRINTF("WLAN State: ");

	int ret = wlan_get_state();
	if (ret == MWM_INITIALIZED)
	{
		PRINTF("Initialized\r\n");
	}
	else if (ret == MWM_CONNECTED)
	{
		char ssid[33]    = {0};
		char ip_addr[16] = {0};
		ret              = mwm_wlan_info(ssid, ip_addr);
		if (ret == 0)
		{
			PRINTF("Connected\r\nSSID: %s\r\nIP Address: %s\r\n", ssid, ip_addr);

		}
		else
		{
			PRINTF("Connected\r\n");
		}
	}
	else if (ret == MWM_CONNECTING)
	{
		ret = mwm_get_param(MWM_MOD_WLAN, MWM_WLAN_SSID, g_buffer, MWM_BUFFER_LEN);
		if (ret < 0)
		{
			PRINTF("Connecting...\r\n");
		}
		else
		{
			PRINTF("Connecting to %s\r\n", g_buffer);
		}
	}
	else if (ret == MWM_AUTH_FAILED)
	{
		PRINTF("Connection failed, Wi-Fi authentication failed.\r\n");
	}
	else if (ret == MWM_NETWORK_NOT_FOUND)
	{
		PRINTF("Connection failed, WLAN not found.\r\n");
	}
	else if (ret == MWM_PROVISIONING)
	{
		ret = mwm_get_param(MWM_MOD_PROV, MWM_PROV_SSID, g_buffer, MWM_BUFFER_LEN);
		if (ret < 0)
		{
			PRINTF("Could not get param: %s, error: %d\r\n", MWM_PROV_SSID, ret);
			while (1)
				;
		}
		PRINTF("Provisioning mode\r\n\r\n");
		PRINTF(
				"For configuration by web application: connect to WLAN: %s and open address: http://192.168.10.1 "
				"in web browser.\r\n",
				g_buffer);
		PRINTF("For configuration by this application select from menu: '4 - WLAN Configuration - Client'\r\n\r\n");
	}
	else if (ret == MWM_DISCONNECTED)
	{
		PRINTF("Disconnected\r\n");
	}
	else
	{
		PRINTF("%d\r\n", ret);
	}
	PRINTF("--------------------------------\r\n");
}

void wlan_scan() {
	int ret;

	PRINTF("Scanning...\r\n");
	ret = mwm_wlan_scan(g_wlans, MAX_WLAN_SCAN);
	if (ret < 0)
	{
		PRINTF("WLAN scan failed, error: %d\r\n", ret);
		while (1)
			;
	}

	if (ret == 0)
	{
		PRINTF("WLANs not found\r\n");
		return;
	}

	int i;
	PRINTF("\r\n");
	for (i = 0; i < ret; i++)
	{
		PRINTF("SSID: %s\r\n", g_wlans[i].ssid);
		PRINTF("Channel: %d\r\n", g_wlans[i].channel);
		PRINTF("RSSI: %d\r\n", g_wlans[i].rssi);
		PRINTF("Security: %d\r\n", g_wlans[i].security);
		PRINTF("\r\n");
	}
}

void wlan_connect() {
	int ret;

	ret = wlan_get_state();
	if (ret != MWM_DISCONNECTED)
	{
		PRINTF("WLAN must be in disconnected state\r\n");
		return;
	}

	ret = mwm_get_param(MWM_MOD_WLAN, MWM_WLAN_SSID, g_buffer, MWM_BUFFER_LEN);
	if (ret < 0)
	{
		PRINTF("Connecting...\r\n");
	}
	else
	{
		PRINTF("Connecting to %s\r\n", g_buffer);
	}

	ret = mwm_wlan_connect();
	if (ret < 0)
	{
		PRINTF("WLAN connect failed, error: %d\r\n", ret);
		while (1)
			;
	}
}

void wlan_disconnect() {

	int ret;

	ret = wlan_get_state();
	if (ret != MWM_CONNECTED)
	{
		PRINTF("WLAN must be in connected state\r\n");
		return;
	}

	PRINTF("Disconnecting...\r\n");
	ret = mwm_wlan_disconnect();
	if (ret < 0)
	{
		PRINTF("WLAN disconnect failed, error: %d\r\n", ret);
		while (1)
			;
	}
}

void wlan_reboot() {

	int ret;

	PRINTF("Rebooting WLAN module...\r\n");
	ret = mwm_reboot();
	if (ret < 0)
	{
		PRINTF("WLAN reboot failed, error: %d\r\n", ret);
		while (1)
			;
	}

	PRINTF("Starting WLAN...\r\n");
	ret = mwm_wlan_start();
	if (ret < 0)
	{
		PRINTF("Could not start WLAN subsystem, error: %d\r\n", ret);
		while (1)
			;
	}
}

void wlan_config(char *ap_ssid, char *ap_passphrase , char *ap_security_mode) {

	int ret;
	bool configured = false;
	bool recofigure = false;

	ret = mwm_get_param(MWM_MOD_WLAN, MWM_WLAN_CONFIGURED, g_buffer, MWM_BUFFER_LEN);
	if (ret < 0)
	{
		PRINTF("Could not get param: %s, error: %d\r\n", MWM_PROV_SSID, ret);
		while (1)
			;
	}

	if (strcmp(g_buffer, "1") == 0)
	{
		/* WLAN is configured */
		ret = mwm_get_param(MWM_MOD_WLAN, MWM_WLAN_SSID, g_buffer, MWM_BUFFER_LEN);
		if (ret < 0)
		{
			PRINTF("Could not get param: %s, error: %d\r\n", MWM_PROV_SSID, ret);
			while (1);
			;
		}

		if(strcmp(g_buffer, ap_ssid))
			recofigure = true;

		ret = mwm_get_param(MWM_MOD_WLAN, MWM_WLAN_SECURITY, g_buffer, MWM_BUFFER_LEN);
		if (ret < 0)
		{
			PRINTF("Could not get param: %s, error: %d\r\n", MWM_PROV_SSID, ret);
			while (1)
				;
		}

		if(strcmp(g_buffer, ap_security_mode))
			recofigure = true;

		configured = true;
	}

	if(recofigure) {

		PRINTF("Reconfigure WLAN module\r\n");

		ret = mwm_set_param(MWM_MOD_WLAN, MWM_WLAN_SSID, ap_ssid);
		if (ret < 0)
		{
			PRINTF("Could not set param: %s, error: %d\r\n", MWM_WLAN_SSID, ret);
			while (1)
				;
		}

		ret = mwm_set_param(MWM_MOD_WLAN, MWM_WLAN_SECURITY, ap_security_mode);
		if (ret < 0)
		{
			PRINTF("Could not set param: %s, error: %d\r\n", MWM_WLAN_SSID, ret);
			while (1)
				;
		}

		if (g_buffer[0] > '1')
		{
			/* Security is not open - passphrase is required */
			ret = mwm_set_param(MWM_MOD_WLAN, MWM_WLAN_PASSPHRASE, ap_passphrase);
			if (ret < 0)
			{
				PRINTF("Could not set param: %s, error: %d\r\n", MWM_WLAN_SSID, ret);
				while (1)
					;
			}
		}

		if (configured == false)
		{
			ret = mwm_set_param(MWM_MOD_WLAN, MWM_WLAN_CONFIGURED, "1");
			if (ret < 0)
			{
				PRINTF("Could not set param: %s, error: %d\r\n", MWM_WLAN_CONFIGURED, ret);
				while (1)
					;
			}
		}
		PRINTF("\r\n");

		wlan_reboot();
	}
}

void wlan_init(char *ap_ssid, char *ap_passphrase , char *ap_security_mode) {

	int ret;

		/* Initialize Serial MWM */
		PRINTF("Initializing Serial MWM...\r\n");
		ret = mwm_init();
		if (ret < 0) {

			PRINTF("Could not initialize Serial MWM, error: %d\r\n", ret);
			while (1)
				;
		}
		ret = wlan_get_state();
		if (ret == MWM_INITIALIZED) {

			PRINTF("WLAN Starting...\r\n");
			ret = mwm_wlan_start();
			if (ret < 0) {

				PRINTF("Could not start WLAN subsystem, error: %d\r\n", ret);
				while (1)
					;
			}
		}

		wlan_config(ap_ssid, ap_passphrase , ap_security_mode);
		PRINTF("WLAN Connecting...\r\n");
		while(wlan_get_state()!= MWM_CONNECTED)
			;
		wlan_state();
}

void http_POST(const char *reqdata, char *respdata, char *contdata) {

	char hostname[HOSTNAME_LEN]={0};

	for(int i=0; ((reqdata[i]!='/') && (reqdata[i]!='\0') && i<HOSTNAME_LEN); i++) {

		hostname[i]=reqdata[i];
	}

	int ret;
	int s;
	int data_len;

	ret = wlan_get_state();
	if (ret != MWM_CONNECTED) {

		PRINTF("WLAN must be in connected state\r\n");
		return;
	}

	s = mwm_socket(MWM_TCP);
	if (s < 0) {

		PRINTF("Could not create socket, error: %d\r\n", ret);
		while (1)
			;
	}

	sprintf(g_http_srv_addr.host, hostname);
	g_http_srv_addr.port = 80;

	PRINTF("Connecting to: %s:%d\r\n", g_http_srv_addr.host, g_http_srv_addr.port);

	ret = mwm_connect(s, &g_http_srv_addr, sizeof(g_http_srv_addr));
	if (ret != 0) {

		PRINTF("Could not connect to server, error: %d\r\n", ret);
		while (1)
			;
	}

	char request[256];
	sprintf(request,"POST http://%s HTTP/1.0\r\n"
			"Host: %s\r\n"
			"Content-Type: application/json\r\n"
			"Content-Length: %d\r\n\r\n"
			"%s\r\n", reqdata, hostname, strlen(contdata), contdata);

	data_len = strlen(request);
	ret      = mwm_send(s, request, data_len);
	if (ret != data_len) {

		PRINTF("Could not send data, error: %d\r\n", ret);
		while (1)
			;
	}

	ret = mwm_recv_timeout(s, respdata, RXD_BUFFER_LEN, 0);

	respdata[ret] = '\0';

	ret = mwm_close(s);
	if (ret != 0) {

		PRINTF("Could not close socket, error: %d\r\n", ret);
		while (1)
			;
	}
}

void http_GET(const char *reqdata, char *respdata) {

	char hostname[HOSTNAME_LEN]={0};

	for(int i=0; ((reqdata[i]!='/') && (reqdata[i]!='\0') && i<HOSTNAME_LEN); i++) {

		hostname[i]=reqdata[i];
	}

	int ret;
	int s;
	int data_len;

	ret = wlan_get_state();
	if (ret != MWM_CONNECTED) {

		PRINTF("WLAN must be in connected state\r\n");
		return;
	}

	s = mwm_socket(MWM_TCP);
	if (s < 0) {

		PRINTF("Could not create socket, error: %d\r\n", ret);
		while (1)
			;
	}

	sprintf(g_http_srv_addr.host, hostname);
	g_http_srv_addr.port = 80;

	PRINTF("Connecting to: %s:%d\r\n", g_http_srv_addr.host, g_http_srv_addr.port);

	ret = mwm_connect(s, &g_http_srv_addr, sizeof(g_http_srv_addr));
	if (ret != 0) {

		PRINTF("Could not connect to server, error: %d\r\n", ret);
		while (1)
			;
	}

	char request[256];
	sprintf(request,"GET http://%s HTTP/1.0\r\nHost: %s\r\n\r\n", reqdata, hostname);

	data_len = strlen(request);
	ret      = mwm_send(s, request, data_len);
	if (ret != data_len) {

		PRINTF("Could not send data, error: %d\r\n", ret);
		while (1)
			;
	}

	ret = mwm_recv_timeout(s, respdata, RXD_BUFFER_LEN, 0);
	respdata[ret] = '\0';

	ret = mwm_close(s);
	if (ret != 0) {

		PRINTF("Could not close socket, error: %d\r\n", ret);
		while (1)
			;
	}
}

void http_head_parser(char *headdata, char *parseval, char* keyval) {

	char *parse=0;
	int i;

	parse=strstr(headdata, keyval);
	if(parse) {

		parse += strlen(keyval);
		for(i=0; (parse[i] != '\r') && (parse[i] != '\n') ; i++)
			parseval[i]=parse[i];
		parseval[i]=0;
	}
}
