import { useForm } from 'react-hook-form';
import './styles.css';

export const SettingsForm = ({ settings, onSave }) => {
    const { register, handleSubmit, formState: { errors } } = useForm({
        defaultValues: settings
    });

    const onSubmit = async (data) => {
        await onSave(data);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="settings-form">
            <div className="form-group">
                <label>
                    <input type="checkbox" {...register('enabled')} />
                    Enable extension
                </label>
            </div>
            <div className="form-group">
                <label>
                    <input type="checkbox" {...register('overlay')} />
                    Show overlay
                </label>
            </div>
            <div className="form-group">
                <label htmlFor="maxWidth">Max Width</label>
                <input id="maxWidth" {...register('maxWidth', { required: true })} />
                {errors.maxWidth && <span className="error-message">This field is required</span>}
            </div>
            <div className="form-group">
                <label htmlFor="maxHeight">Max Height</label>
                <input id="maxHeight" {...register('maxHeight', { required: true })} />
                {errors.maxHeight && <span className="error-message">This field is required</span>}
            </div>
            <div className="form-group">
                <label htmlFor="shortcutKey">Shortcut Key</label>
                <input id="shortcutKey" {...register('shortcutKey', { required: true, maxLength: 1 })} />
                {errors.shortcutKey && <span className="error-message">Please enter a single character</span>}
</div>
<div className="form-group">
    <label htmlFor="excludedDomains">Excluded Domains</label>
    <textarea id="excludedDomains" {...register('excludedDomains')} />
    <small>One domain per line</small>
            </div>
            <button type="submit">Save Settings</button>
        </form>
    );
};
