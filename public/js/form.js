// form.js — Validación y envío del formulario de registro

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('registroForm');
    const btnSubmit = document.getElementById('btnSubmit');
    const successMessage = document.getElementById('successMessage');

    // Set max dates (today for both date fields)
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('fechaNacimiento').setAttribute('max', today);
    document.getElementById('fechaNacimiento').setAttribute('min', '1920-01-01');
    document.getElementById('fechaIngreso').setAttribute('max', today);

    // Allow only digits in phone fields
    document.querySelectorAll('input[type=tel]').forEach(input => {
        input.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
        });
    });

    // Clear error on input
    form.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', () => {
            input.classList.remove('invalid');
            const errorEl = document.getElementById('error-' + input.id);
            if (errorEl) errorEl.textContent = '';
        });
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Validate all fields
        let isValid = true;
        const errors = {};

        // Nombre
        const nombre = document.getElementById('nombre').value.trim();
        if (!nombre) {
            errors.nombre = 'El nombre es obligatorio';
            isValid = false;
        } else if (nombre.length < 3) {
            errors.nombre = 'El nombre debe tener al menos 3 caracteres';
            isValid = false;
        }

        // Fecha nacimiento
        const fechaNac = document.getElementById('fechaNacimiento').value;
        if (!fechaNac) {
            errors.fechaNacimiento = 'La fecha de nacimiento es obligatoria';
            isValid = false;
        } else if (new Date(fechaNac) > new Date()) {
            errors.fechaNacimiento = 'La fecha no puede ser futura';
            isValid = false;
        }

        // Fecha ingreso
        const fechaIng = document.getElementById('fechaIngreso').value;
        if (!fechaIng) {
            errors.fechaIngreso = 'La fecha de ingreso es obligatoria';
            isValid = false;
        } else if (new Date(fechaIng) > new Date()) {
            errors.fechaIngreso = 'La fecha de ingreso no puede ser futura';
            isValid = false;
        }

        // Celular
        const celular = document.getElementById('celular').value;
        if (!celular) {
            errors.celular = 'El celular es obligatorio';
            isValid = false;
        } else if (!/^\d{10}$/.test(celular)) {
            errors.celular = 'El celular debe tener exactamente 10 dígitos';
            isValid = false;
        }

        // Tel emergencia
        const telEmergencia = document.getElementById('telEmergencia').value;
        if (!telEmergencia) {
            errors.telEmergencia = 'El teléfono de emergencia es obligatorio';
            isValid = false;
        } else if (!/^\d{10}$/.test(telEmergencia)) {
            errors.telEmergencia = 'El teléfono debe tener exactamente 10 dígitos';
            isValid = false;
        }

        // Show errors
        Object.keys(errors).forEach(field => {
            const input = document.getElementById(field === 'fechaNacimiento' ? 'fechaNacimiento' : field === 'fechaIngreso' ? 'fechaIngreso' : field === 'telEmergencia' ? 'telEmergencia' : field);
            if (input) input.classList.add('invalid');
            const errorEl = document.getElementById('error-' + (field === 'nombre' ? 'nombre' : field));
            if (errorEl) errorEl.textContent = errors[field];
        });

        if (!isValid) {
            // Scroll to first error
            const firstError = form.querySelector('.invalid');
            if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        // Submit
        btnSubmit.disabled = true;
        btnSubmit.querySelector('.btn-text').style.display = 'none';
        btnSubmit.querySelector('.btn-loading').style.display = 'inline';

        try {
            const response = await fetch('/api/registros', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombre_completo: nombre,
                    fecha_nacimiento: fechaNac,
                    fecha_ingreso: fechaIng,
                    celular: celular,
                    telefono_emergencia: telEmergencia
                })
            });

            const data = await response.json();

            if (response.ok) {
                form.style.display = 'none';
                successMessage.style.display = 'block';
                successMessage.scrollIntoView({ behavior: 'smooth' });
            } else {
                alert('Error: ' + (data.errors ? data.errors.join(', ') : data.message || 'Error al guardar'));
            }
        } catch (error) {
            alert('Error de conexión. Verifica tu internet e intenta de nuevo.');
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.querySelector('.btn-text').style.display = 'inline';
            btnSubmit.querySelector('.btn-loading').style.display = 'none';
        }
    });
});

function resetForm() {
    const form = document.getElementById('registroForm');
    const successMessage = document.getElementById('successMessage');
    form.reset();
    form.style.display = 'block';
    successMessage.style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
