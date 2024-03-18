################################################################################
# Automatically-generated file. Do not edit!
################################################################################

# Add inputs and outputs from these tool invocations to the build variables 
C_SRCS += \
../source/sch_embedded_controller.c \
../source/semihost_hardfault.c \
../source/wlan_mwm.c 

C_DEPS += \
./source/sch_embedded_controller.d \
./source/semihost_hardfault.d \
./source/wlan_mwm.d 

OBJS += \
./source/sch_embedded_controller.o \
./source/semihost_hardfault.o \
./source/wlan_mwm.o 


# Each subdirectory must supply rules for building sources it contributes
source/%.o: ../source/%.c source/subdir.mk
	@echo 'Building file: $<'
	@echo 'Invoking: MCU C Compiler'
	arm-none-eabi-gcc -D__REDLIB__ -DCPU_LPC55S69JBD100 -DCPU_LPC55S69JBD100_cm33 -DCPU_LPC55S69JBD100_cm33_core0 -DSDK_OS_BAREMETAL -DSDK_DEBUGCONSOLE=1 -DPRINTF_FLOAT_ENABLE=1 -DSDK_OS_FREE_RTOS -DSERIAL_PORT_TYPE_UART=1 -D__MCUXPRESSO -D__USE_CMSIS -DDEBUG -I"/home/kamil/Dokumenty/McuXpressoIDE/sch_embedded_controller/board" -I"/home/kamil/Dokumenty/McuXpressoIDE/sch_embedded_controller/source" -I"/home/kamil/Dokumenty/McuXpressoIDE/sch_embedded_controller/freertos/freertos-kernel/include" -I"/home/kamil/Dokumenty/McuXpressoIDE/sch_embedded_controller/drivers" -I"/home/kamil/Dokumenty/McuXpressoIDE/sch_embedded_controller/drivers/freertos" -I"/home/kamil/Dokumenty/McuXpressoIDE/sch_embedded_controller/device" -I"/home/kamil/Dokumenty/McuXpressoIDE/sch_embedded_controller/CMSIS" -I"/home/kamil/Dokumenty/McuXpressoIDE/sch_embedded_controller/utilities" -I"/home/kamil/Dokumenty/McuXpressoIDE/sch_embedded_controller/component/uart" -I"/home/kamil/Dokumenty/McuXpressoIDE/sch_embedded_controller/component/serial_manager" -I"/home/kamil/Dokumenty/McuXpressoIDE/sch_embedded_controller/freertos/freertos-kernel/portable/GCC/ARM_CM33_NTZ/non_secure" -I"/home/kamil/Dokumenty/McuXpressoIDE/sch_embedded_controller/component/lists" -I"/home/kamil/Dokumenty/McuXpressoIDE/sch_embedded_controller/component/serial_mwm" -I"/home/kamil/Dokumenty/McuXpressoIDE/sch_embedded_controller/startup" -O0 -fno-common -g3 -Wall -c -ffunction-sections -fdata-sections -ffreestanding -fno-builtin -fmerge-constants -fmacro-prefix-map="$(<D)/"= -mcpu=cortex-m33 -mfpu=fpv5-sp-d16 -mfloat-abi=hard -mthumb -D__REDLIB__ -fstack-usage -specs=redlib.specs -MMD -MP -MF"$(@:%.o=%.d)" -MT"$(@:%.o=%.o)" -MT"$(@:%.o=%.d)" -o "$@" "$<"
	@echo 'Finished building: $<'
	@echo ' '


clean: clean-source

clean-source:
	-$(RM) ./source/sch_embedded_controller.d ./source/sch_embedded_controller.o ./source/semihost_hardfault.d ./source/semihost_hardfault.o ./source/wlan_mwm.d ./source/wlan_mwm.o

.PHONY: clean-source

