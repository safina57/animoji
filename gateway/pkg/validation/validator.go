package validation

import (
	"fmt"
	"strings"

	"github.com/go-playground/validator/v10"
)

var validate *validator.Validate

func init() {
	validate = validator.New()
}

// Validate validates a struct using struct tags and returns formatted errors
func Validate(s any) error {
	if err := validate.Struct(s); err != nil {
		if validationErrors, ok := err.(validator.ValidationErrors); ok {
			var messages []string
			for _, e := range validationErrors {
				messages = append(messages, formatError(e))
			}
			return fmt.Errorf("validation failed: %s", strings.Join(messages, "; "))
		}
		return err
	}
	return nil
}

// formatError converts a validation error into a human-readable message
func formatError(e validator.FieldError) string {
	field := strings.ToLower(e.Field())

	switch e.Tag() {
	case "required":
		return fmt.Sprintf("%s is required", field)
	case "min":
		return fmt.Sprintf("%s must be at least %s", field, e.Param())
	case "max":
		return fmt.Sprintf("%s must not exceed %s", field, e.Param())
	case "email":
		return fmt.Sprintf("%s must be a valid email", field)
	case "uuid":
		return fmt.Sprintf("%s must be a valid UUID", field)
	case "url":
		return fmt.Sprintf("%s must be a valid URL", field)
	case "oneof":
		return fmt.Sprintf("%s must be one of: %s", field, e.Param())
	case "gt":
		return fmt.Sprintf("%s must be greater than %s", field, e.Param())
	case "gte":
		return fmt.Sprintf("%s must be greater than or equal to %s", field, e.Param())
	case "lt":
		return fmt.Sprintf("%s must be less than %s", field, e.Param())
	case "lte":
		return fmt.Sprintf("%s must be less than or equal to %s", field, e.Param())
	case "len":
		return fmt.Sprintf("%s must be exactly %s characters", field, e.Param())
	default:
		return fmt.Sprintf("%s failed validation (%s)", field, e.Tag())
	}
}

// ValidateVar validates a single variable against a validation tag
func ValidateVar(field any, tag string) error {
	if err := validate.Var(field, tag); err != nil {
		if validationErrors, ok := err.(validator.ValidationErrors); ok {
			for _, e := range validationErrors {
				return fmt.Errorf("validation failed: %s", formatError(e))
			}
		}
		return err
	}
	return nil
}
