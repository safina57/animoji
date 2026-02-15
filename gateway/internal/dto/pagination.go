package dto

// PaginationParams represents validated pagination parameters
type PaginationParams struct {
	Limit  int `validate:"required,min=1,max=100"`
	Offset int `validate:"omitempty,min=0"`
}
