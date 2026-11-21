import { test, expect } from '@playwright/test';

test.describe('Public Booking Flow', () => {
  test('should complete a booking and show correct data on success screen', async ({ page }) => {
    // 1. Navigate to restyle booking page
    await page.goto('/restyle/agendar');
    
    // 2. Select Service
    await page.getByText(/corte/i).first().click();
    
    // 3. Select Professional
    await page.getByText(/Otávio Carneiro/i).first().click();
    
    // 4. Select Date (try first available enabled day)
    const availableDay = page.locator('button.rdp-day:not(.rdp-day_disabled)').first();
    await availableDay.click();
    
    // 5. Select Time (wait for slots and pick first)
    // If no slots on current day, the user might need to pick another, 
    // but in restyle test data, usually there are slots.
    const timeSlot = page.locator('button').filter({ hasText: /^\d{2}:\d{2}$/ }).first();
    await expect(timeSlot).toBeVisible({ timeout: 10000 });
    await timeSlot.click();
    
    // 6. Fill Data
    await page.getByPlaceholder(/nome/i).fill('E2E Automated Test');
    await page.getByPlaceholder(/WhatsApp/i).fill('77988227549');
    
    // 7. Submit
    await page.getByRole('button', { name: /Confirmar Agendamento|Finalizar/i }).click();
    
    // 8. Success Screen Validations
    await expect(page.getByText('Reservado!')).toBeVisible({ timeout: 15000 });
    
    // Validate Service Name
    const serviceVal = page.locator('div').filter({ hasText: /^Serviço$/ }).locator('span').nth(1);
    await expect(serviceVal).toContainText(/corte/i);
    
    // Validate Professional Name
    const profVal = page.locator('div').filter({ hasText: /^Profissional$/ }).locator('span').nth(1);
    await expect(profVal).toContainText(/Otávio/i);
    
    // Validate Date and Time are present
    await expect(page.locator('div').filter({ hasText: /^Data$/ })).toBeVisible();
    await expect(page.locator('div').filter({ hasText: /^Horário$/ })).toBeVisible();
    
    // Validate WhatsApp Button
    const waButton = page.getByRole('button', { name: /Confirmar no WhatsApp/i });
    await expect(waButton).toBeVisible();
    await expect(waButton).toBeEnabled();
  });
});
