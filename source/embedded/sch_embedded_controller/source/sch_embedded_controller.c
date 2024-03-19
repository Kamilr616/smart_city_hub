/*
 * Copyright 2016-2024 NXP
 * All rights reserved.
 *
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * @file    sch_embedded_controller.c
 * @brief   Application entry point.
 */
#include <stdio.h>
#include "board.h"
#include "peripherals.h"
#include "pin_mux.h"
#include "clock_config.h"
#include "LPC55S69_cm33_core0.h"
#include "fsl_debug_console.h"
#include "wlan_mwm.h"
/*******************************************************************************
 * Definitions
 ******************************************************************************/
/*-----------------------------------------------------------------------------
AP_SECURITY_MODE:
0 - Open
1 - WEP (Open mode)
2 - WEP (Shared mode)
3 - WPA-PSK
4 - WPA2-PSK
9 - WPA3-SAE
----------------------------------------------------------------------------*/
#define AP_SSID "SSID"
#define AP_PASSPHRASE "PASS"
#define AP_SECURITY_MODE "4"
/*---------------------------------------------------------------------------*/
#define STR_BUFFER_LEN 128
#define CDE_BUFFER_LEN 64
/*---------------------------------------------------------------------------*/
#define API_URL "https://api.thingspeak.com/channels/2475480/feeds/last.json?api_key=NB8P8YMRHB9BM4T5"
/*******************************************************************************
 * Variables
 ******************************************************************************/
char g_bufferRX[RXD_BUFFER_LEN]={0}; // HTTP RX Buffer
char g_bufferTX[TXD_BUFFER_LEN]={0}; // HTTP TX Buffer
char g_sbuffer[STR_BUFFER_LEN]; // Text Buffer
//BMP280_HandleTypedef bmp280;
/*******************************************************************************
 * Prototypes
 ******************************************************************************/
#ifndef MSEC_TO_TICK
#define MSEC_TO_TICK(msec) ((uint32_t)(msec) * (uint32_t)configTICK_RATE_HZ / 1000uL)
#endif
/*******************************************************************************
 * Code
 ******************************************************************************/
void main_task(void *pvParameters) {
	int ret;
	/* Initialize Serial MWM */
	PRINTF("Initializing...\r\n");
	ret = mwm_init();
	if (ret < 0) {
	PRINTF("Could not initialize Serial MWM, error: %d\r\n", ret);
	while (1)
	;
	}
	ret = wlan_get_state();
	if (ret == MWM_INITIALIZED) {
	PRINTF("Starting WLAN...\r\n");
	ret = mwm_wlan_start();
	if (ret < 0) {
	PRINTF("Could not start WLAN subsystem, error: %d\r\n", ret);
	while (1)
	;
	}
	}
	wlan_config(AP_SSID, AP_PASSPHRASE , AP_SECURITY_MODE);
	while(wlan_get_state()!= MWM_CONNECTED);
	wlan_state();
	PRINTF("WiFi: %s", AP_SSID);
	vTaskDelay(MSEC_TO_TICK(1000));
	char codebuffer[CDE_BUFFER_LEN]={0};
	uint8_t counter=0;
	while (1) {
		if(counter==0) {
			http_GET(API_URL, codebuffer);
			//http_head_parser(g_bufferRX, codebuffer, "HTTP");
			//sprintf(g_sbuffer,"HTTP%s", codebuffer);
			PRINTF(codebuffer);
		}
		counter++;
		if(counter >= 15) {
			counter=0;
		}
		vTaskDelay(MSEC_TO_TICK(1000));
	}
}
/*
 * @brief Application entry point.
 */
int main(void) {
	/* Init board hardware. */
	BOARD_InitBootPins();
	BOARD_InitBootClocks();
	BOARD_InitBootPeripherals();
#ifndef BOARD_INIT_DEBUG_CONSOLE_PERIPHERAL
	/* Init FSL debug console. */
	BOARD_InitDebugConsole();
#endif
	if (xTaskCreate(main_task, "main_task", 350, NULL, MAIN_TASK_PRIORITY, NULL) != pdPASS) {
		PRINTF("Task creation failed!.\r\n");
		while (1)
			;
	}
	vTaskStartScheduler();
	while(1) {
	}
	return 0 ;
}
